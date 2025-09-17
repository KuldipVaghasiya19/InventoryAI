# # File: forecast_service_fastapi_prophet.py
# # FastAPI service (Prophet only, with accuracy, fitted values, and forecast)

# import warnings
# import pandas as pd
# import numpy as np
# import traceback
# from fastapi import FastAPI, UploadFile, File
# from fastapi.responses import JSONResponse
# from fastapi.middleware.cors import CORSMiddleware
# from prophet import Prophet
# from sklearn.metrics import mean_squared_error

# warnings.filterwarnings("ignore", category=FutureWarning)

# app = FastAPI()

# # Allow frontend (React/Vue/etc.)
# origins = ["http://localhost:5173"]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ---------- Helpers ----------
# def smape(y_true, y_pred):
#     y_true = np.array(y_true, dtype=float)
#     y_pred = np.array(y_pred, dtype=float)
#     denom = (np.abs(y_true) + np.abs(y_pred))
#     denom[denom == 0] = 1.0
#     numer = 2 * np.abs(y_pred - y_true)
#     return 100.0 * np.mean(numer / denom)

# # ---------- Column detection ----------
# def detect_columns(df):
#     if "Product" in df.columns and "YearMonth" in df.columns and "sales" in df.columns:
#         return "Product", "YearMonth", "sales"

#     prod_candidates = [c for c in df.columns if "product" in c.lower() or "item" in c.lower() or "sku" in c.lower()]
#     date_candidates = [c for c in df.columns if "date" in c.lower() or "month" in c.lower() or "yearmonth" in c.lower()]
#     qty_candidates = [c for c in df.columns if "sales" in c.lower() or "qty" in c.lower() or "quantity" in c.lower()]

#     product_col = prod_candidates[0] if prod_candidates else None
#     date_col = date_candidates[0] if date_candidates else None
#     qty_col = qty_candidates[0] if qty_candidates else None

#     if not product_col or not date_col or not qty_col:
#         raise ValueError(f"Couldn't detect columns: product={product_col}, date={date_col}, qty={qty_col}")

#     return product_col, date_col, qty_col

# # ---------- Preprocessing ----------
# def preprocess(df):
#     product_col, date_col, qty_col = detect_columns(df)

#     df2 = df.rename(columns={product_col: "product_code", date_col: "date", qty_col: "sales"})
#     df2["date"] = pd.to_datetime(df2["date"], errors="coerce")
#     df2["date"] = df2["date"].dt.to_period("M").dt.to_timestamp()

#     # aggregate duplicates
#     df2 = df2.groupby(["product_code", "date"], as_index=False)["sales"].sum()

#     processed = []
#     for prod, g in df2.groupby("product_code"):
#         g = g.sort_values("date")
#         g["sales"] = pd.to_numeric(g["sales"], errors="coerce").fillna(0)

#         g = g.set_index("date").sort_index()
#         start, end = g.index.min(), g.index.max()
#         if pd.isna(start) or pd.isna(end):
#             continue

#         full_idx = pd.date_range(start, end, freq="MS")
#         g = g.reindex(full_idx)
#         g.index.name = "date"
#         g["product_code"] = prod

#         # month-wise median imputation
#         month_map = g.groupby(g.index.month)["sales"].median().to_dict()
#         g["sales"] = g["sales"].fillna(pd.Series(g.index.month.map(month_map), index=g.index))
#         g["sales"] = g["sales"].interpolate().ffill().bfill().fillna(0)

#         g = g.reset_index()
#         processed.append(g)

#     result = pd.concat(processed, ignore_index=True)
#     result = result.sort_values(["product_code", "date"])  # ✅ ensure sorting
#     return result

# # ---------- Train & Forecast (Prophet only) ----------
# def train_forecast(df, horizon=3):
#     forecasts_by_date = {}
#     metrics = []
#     fitted = []

#     # common future dates
#     max_date = df["date"].max()
#     forecast_dates = pd.date_range(max_date + pd.offsets.MonthBegin(1), periods=horizon, freq="MS")
#     forecast_dates_str = [d.strftime("%Y-%m-%d") for d in forecast_dates]
#     for d in forecast_dates_str:
#         forecasts_by_date[d] = {}

#     for prod, g in df.groupby("product_code"):
#         g = g.sort_values("date").reset_index(drop=True)

#         if g.shape[0] < 6:
#             continue  # skip if not enough history

#         # Train/test split
#         test_len = min(6, max(3, int(g.shape[0] * 0.2)))
#         train = g.iloc[:-test_len]
#         test = g.iloc[-test_len:]

#         model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
#         model.fit(train.rename(columns={"date": "ds", "sales": "y"}))

#         future = model.make_future_dataframe(periods=test_len + horizon, freq="MS")
#         pred = model.predict(future)[["ds", "yhat"]].set_index("ds")

#         # ---- Accuracy ----
#         y_true = test.set_index("date")["sales"].values
#         y_pred = pred.loc[test["date"], "yhat"].values
#         smape_val = smape(y_true, y_pred)
#         rmse_val = float(np.sqrt(mean_squared_error(y_true, y_pred)))

#         metrics.append({
#             "product_code": prod,
#             "sMAPE": round(smape_val, 2),
#             "RMSE": round(rmse_val, 2)
#         })

#         # ---- Fitted values for historical dates ----
#         for d, actual, forecast in zip(g["date"], g["sales"], pred.loc[g["date"], "yhat"].values):
#             fitted.append({
#                 "product_code": prod,
#                 "date": d.strftime("%Y-%m-%d"),
#                 "actual": int(actual),
#                 "fitted": int(round(forecast))
#             })

#         # ---- Forecast next horizon (use last N months only) ----
#         fc_future = pred.tail(horizon)
#         for d, val in zip(fc_future.index, fc_future["yhat"].values):
#             forecasts_by_date[d.strftime("%Y-%m-%d")][prod] = int(round(val))

#     # ✅ format as list of dicts
#     forecasts_list = [{date: forecasts_by_date[date]} for date in forecast_dates_str]
#     return {"forecasts": forecasts_list, "metrics": metrics, "fitted": fitted}

# # ---------- FastAPI Endpoint ----------
# @app.post("/forecast")
# async def forecast_endpoint(file: UploadFile = File(...)):
#     try:
#         file_location = "inventry_sales.xlsx"
#         with open(file_location, "wb") as f:
#             f.write(await file.read())

#         raw = pd.read_excel(file_location)
#         processed = preprocess(raw)
#         result = train_forecast(processed, horizon=3)
#         return JSONResponse(content=result)
#     except Exception as e:
#         tb = traceback.format_exc()
#         print("[/forecast] Exception:\n", tb)
#         return JSONResponse(content={"error": str(e), "traceback": tb}, status_code=500)



# main.py

# from flask import Flask, request, jsonify
# import pandas as pd
# from prophet import Prophet
# import matplotlib.pyplot as plt
# import json
# from sklearn.metrics import mean_absolute_percentage_error
# import numpy as np
# from statsmodels.tsa.holtwinters import ExponentialSmoothing
# import warnings
# from fastapi.middleware.cors import CORSMiddleware

# warnings.filterwarnings("ignore", category=FutureWarning)

# app = Flask(__name__)
# origins = ["http://localhost:5173"]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # Try Prophet first, fallback Holt-Winters
# try:
#     from prophet import Prophet
#     use_prophet = True
# except ImportError:
#     from statsmodels.tsa.holtwinters import ExponentialSmoothing
#     use_prophet = False

# def preprocess(df):
#     """Preprocess sales data: fill missing months & values per product."""
#     processed = []
#     df['date'] = pd.to_datetime(df['date'])

#     for prod, g in df.groupby("product_code"):
#         g = g.set_index("date").asfreq("MS")  # ensure monthly frequency
#         # Fill missing values
#         if g["sales"].isna().sum() > 0:
#             month_medians = g.groupby(g.index.month)["sales"].transform("median")
#             g["sales"] = g["sales"].fillna(month_medians)
#             g["sales"] = g["sales"].interpolate().ffill().bfill()
#         g["product_code"] = prod
#         g = g.reset_index()
#         processed.append(g)

#     return pd.concat(processed)


# def train_forecast(df, horizon=3):
#     """Train Prophet/HoltWinters, forecast horizon months, evaluate on last 6 months."""
#     forecasts_by_date = []
#     metrics = []
    
#     # Define regressors for Prophet model
#     regressors = ['mrp', 'discount', 'rating']

#     for prod, g in df.groupby("product_code"):
#         g = g.sort_values("date")
#         train, test = g.iloc[:-6], g.iloc[-6:]

#         # Train model
#         if use_prophet:
#             model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
            
#             # Add regressors to the model
#             for regressor in regressors:
#                 model.add_regressor(regressor)

#             # Prepare the training data
#             train_prophet = train.rename(columns={"date": "ds", "sales": "y"})
            
#             model.fit(train_prophet)
            
#             # Prepare the future dataframe with regressors
#             future = model.make_future_dataframe(periods=horizon + len(test), freq="MS")
#             future = pd.merge(future, g[['date'] + regressors].rename(columns={"date": "ds"}), on="ds", how="left")
#             future[regressors] = future[regressors].fillna(method='ffill')

#             fc = model.predict(future)[["ds", "yhat"]].set_index("ds").tail(len(test) + horizon)
#             fc = fc.rename(columns={"yhat": "forecast"})
#         else:
#             model = ExponentialSmoothing(train["sales"], seasonal="add", seasonal_periods=12)
#             model = model.fit()
#             fc_vals = model.forecast(len(test) + horizon)
#             fc = pd.DataFrame({
#                 "ds": pd.date_range(train["date"].iloc[-1], periods=len(test) + horizon + 1, freq="MS")[1:],
#                 "forecast": fc_vals
#             }).set_index("ds")

#         # MAPE on test
#         y_true = test.set_index("date")["sales"].values
#         y_pred = fc.iloc[:len(test)]["forecast"].values
#         mape = mean_absolute_percentage_error(y_true, y_pred) * 100
#         acc = 100 - mape
#         metrics.append({"product_code": prod, "mape": round(mape, 2), "accuracy": round(acc, 2)})

#         # Future 3 months → round to integers
#         fc_future = fc.iloc[len(test):len(test)+horizon]
#         for d, val in fc_future["forecast"].items():
#             d_str = str(d.date())
#             # If date already exists in dict, append product value
#             if any(d_str in f for f in forecasts_by_date):
#                 for f in forecasts_by_date:
#                     if d_str in f:
#                         f[d_str][prod] = int(round(val))
#             else:
#                 forecasts_by_date.append({d_str: {prod: int(round(val))}})

#     return {"forecasted_products": forecasts_by_date, "metrics": metrics}

# @app.route('/forecast', methods=['POST'])
# def forecast():
#     if 'file' not in request.files:
#         return jsonify({"error": "No file part"}), 400
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({"error": "No selected file"}), 400
#     if file:
#         df = pd.read_csv(file)
#         processed_df = preprocess(df)
#         result = train_forecast(processed_df)
#         return jsonify(result)

# if __name__ == '__main__':
#     app.run()

# from fastapi import FastAPI, UploadFile, File, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# import pandas as pd
# import warnings
# from sklearn.metrics import mean_absolute_percentage_error
# from statsmodels.tsa.holtwinters import ExponentialSmoothing

# warnings.filterwarnings("ignore", category=FutureWarning)

# # Try Prophet first, fallback Holt-Winters
# try:
#     from prophet import Prophet
#     use_prophet = True
# except ImportError:
#     use_prophet = False

# app = FastAPI()

# # CORS settings
# origins = ["http://localhost:5173"]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# def preprocess(df: pd.DataFrame) -> pd.DataFrame:
#     """Preprocess sales data: fill missing months & values per product."""
#     processed = []
#     df['date'] = pd.to_datetime(df['date'])

#     for prod, g in df.groupby("product_code"):
#         g = g.set_index("date").asfreq("MS")  # monthly frequency

#         # Fill missing values
#         if g["sales"].isna().sum() > 0:
#             month_medians = g.groupby(g.index.month)["sales"].transform("median")
#             g["sales"] = g["sales"].fillna(month_medians)
#             g["sales"] = g["sales"].interpolate().ffill().bfill()

#         g["product_code"] = prod
#         g = g.reset_index()
#         processed.append(g)

#     return pd.concat(processed)


# def train_forecast(df: pd.DataFrame, horizon: int = 3):
#     """Train Prophet/HoltWinters, forecast horizon months, evaluate on last 6 months."""
#     forecasts_by_date = []
#     metrics = []
    
#     regressors = ['mrp', 'discount', 'rating']

#     for prod, g in df.groupby("product_code"):
#         g = g.sort_values("date")
#         train, test = g.iloc[:-6], g.iloc[-6:]

#         # Train model
#         if use_prophet:
#             model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
#             for regressor in regressors:
#                 model.add_regressor(regressor)

#             train_prophet = train.rename(columns={"date": "ds", "sales": "y"})
#             model.fit(train_prophet)

#             future = model.make_future_dataframe(periods=horizon + len(test), freq="MS")
#             future = pd.merge(
#                 future, 
#                 g[['date'] + regressors].rename(columns={"date": "ds"}), 
#                 on="ds", how="left"
#             )
#             future[regressors] = future[regressors].fillna(method='ffill')

#             fc = model.predict(future)[["ds", "yhat"]].set_index("ds").tail(len(test) + horizon)
#             fc = fc.rename(columns={"yhat": "forecast"})
#         else:
#             model = ExponentialSmoothing(train["sales"], seasonal="add", seasonal_periods=12).fit()
#             fc_vals = model.forecast(len(test) + horizon)
#             fc = pd.DataFrame({
#                 "ds": pd.date_range(train["date"].iloc[-1], periods=len(test) + horizon + 1, freq="MS")[1:],
#                 "forecast": fc_vals
#             }).set_index("ds")

#         # MAPE on test
#         y_true = test.set_index("date")["sales"].values
#         y_pred = fc.iloc[:len(test)]["forecast"].values
#         mape = mean_absolute_percentage_error(y_true, y_pred) * 100
#         acc = 100 - mape
#         metrics.append({"product_code": prod, "mape": round(mape, 2), "accuracy": round(acc, 2)})

#         # Future 3 months
#         fc_future = fc.iloc[len(test):len(test)+horizon]
#         for d, val in fc_future["forecast"].items():
#             d_str = str(d.date())
#             if any(d_str in f for f in forecasts_by_date):
#                 for f in forecasts_by_date:
#                     if d_str in f:
#                         f[d_str][prod] = int(round(val))
#             else:
#                 forecasts_by_date.append({d_str: {prod: int(round(val))}})

#     return {"forecasted_products": forecasts_by_date, "metrics": metrics}


# @app.post("/forecast")
# async def forecast(file: UploadFile = File(...)):
#     if not file.filename.endswith(".csv"):
#         raise HTTPException(status_code=400, detail="Only CSV files are allowed")

#     try:
#         contents = await file.read()
#         df = pd.read_csv(pd.compat.StringIO(contents.decode("utf-8")))
#         processed_df = preprocess(df)
#         result = train_forecast(processed_df)
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



# 

from fastapi import FastAPI, UploadFile, File, Form
from forecasting import run_forecast
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/forecast")
async def forecast_endpoint(
    train_file: UploadFile = File(...),
    start_month: str = Form(...),
    end_month: str = Form(...)
):
    # # Save uploaded train CSV to a temporary file
    # train_path = f"tmp_train_{train_file.filename}"
    # with open(train_path, "wb") as f:
    #     f.write(await train_file.read())
    
    # # Use the existing test.csv in the same folder
    # test_path = "test.csv" if os.path.exists("test.csv") else None
    
    # # Run forecast
    # result = run_forecast(train_path, start_month, end_month, test_path)
    
    # # Clean up temporary train file
    # # os.remove(train_path)
    
    # return result
     # Print form inputs
    print(f"Start Month: {start_month}")
    print(f"End Month: {end_month}")
    
    # Print uploaded file info
    print(f"Filename: {train_file.filename}")
    print(f"Content type: {train_file.content_type}")
    
    # Read file content
    file_bytes = await train_file.read()
    print(f"File size: {len(file_bytes)} bytes")
    
    # Save uploaded train CSV to a temporary file
    train_path = f"tmp_train_{train_file.filename}"
    with open(train_path, "wb") as f:
        f.write(file_bytes)
    
    # Use the existing test.csv in the same folder
    test_path = "test.csv" if os.path.exists("test.csv") else None
    
    # Run forecast
    result = run_forecast(train_path, start_month, end_month, test_path)
    
    # Clean up temporary train file if needed
    # os.remove(train_path)
    
    return result