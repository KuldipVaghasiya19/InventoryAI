import warnings
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import mean_squared_error

warnings.filterwarnings("ignore", category=FutureWarning)

# Try Prophet first, fallback Holt-Winters
try:
    from prophet import Prophet
    use_prophet = True
except ImportError:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    use_prophet = False


app = FastAPI()

# ✅ Allow requests from frontend running at port 5173
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # allowed origins
    allow_credentials=True,
    allow_methods=["*"],          # allow all HTTP methods
    allow_headers=["*"],          # allow all headers
)

# ---------- Metrics ----------
def smape(y_true, y_pred):
    """Symmetric Mean Absolute Percentage Error"""
    return 100 * np.mean(2 * np.abs(y_pred - y_true) / (np.abs(y_true) + np.abs(y_pred)))


# ---------- Preprocessing ----------
def preprocess(df):
    """Preprocess sales data: fill missing months & values per product."""
    processed = []

    for prod, g in df.groupby("product_code"):
        g = g.set_index("date").asfreq("MS")  # ensure monthly frequency
        # Fill missing values
        if g["sales"].isna().sum() > 0:
            month_medians = g.groupby(g.index.month)["sales"].transform("median")
            g["sales"] = g["sales"].fillna(month_medians)
            g["sales"] = g["sales"].interpolate().ffill().bfill()
        g["product_code"] = prod
        g = g.reset_index()
        processed.append(g)

    return pd.concat(processed)


# ---------- Train & Forecast ----------
def train_forecast(df, horizon=3):
    forecasts_by_date = []
    metrics = []

    for prod, g in df.groupby("product_code"):
        g = g.sort_values("date")
        train, test = g.iloc[:-6], g.iloc[-6:]

        # Train model
        if use_prophet:
            model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
            model.fit(train.rename(columns={"date": "ds", "sales": "y"}))
            future = model.make_future_dataframe(periods=horizon + len(test), freq="MS")
            fc = model.predict(future)[["ds", "yhat"]].set_index("ds").tail(len(test) + horizon)
            fc = fc.rename(columns={"yhat": "forecast"})
        else:
            model = ExponentialSmoothing(train["sales"], seasonal="add", seasonal_periods=12)
            model = model.fit()
            fc_vals = model.forecast(len(test) + horizon)
            fc = pd.DataFrame({
                "ds": pd.date_range(train["date"].iloc[-1], periods=len(test) + horizon + 1, freq="MS")[1:],
                "forecast": fc_vals
            }).set_index("ds")

        # Clip negative predictions
        fc["forecast"] = fc["forecast"].clip(lower=0)

        # Metrics on test
        y_true = test.set_index("date")["sales"].values
        y_pred = fc.iloc[:len(test)]["forecast"].values
        smape_val = smape(y_true, y_pred)
        rmse_val = np.sqrt(mean_squared_error(y_true, y_pred))

        metrics.append({
            "product_code": prod,
            "sMAPE": round(smape_val, 2),
            "RMSE": round(rmse_val, 2)
        })

        # Future 3 months → round to integers
        fc_future = fc.iloc[len(test):len(test)+horizon]
        for d, val in fc_future["forecast"].items():
            d_str = str(d.date())
            if any(d_str in f for f in forecasts_by_date):
                for f in forecasts_by_date:
                    if d_str in f:
                        f[d_str][prod] = int(round(val))
            else:
                forecasts_by_date.append({d_str: {prod: int(round(val))}})

    return {"forecasted_products": forecasts_by_date, "metrics": metrics}


# ---------- FastAPI Endpoint ----------
@app.post("/forecast")
async def forecast_endpoint(file: UploadFile = File(...)):
    try:
        # Save uploaded file as inventory_sales.xlsx
        file_location = "inventory_sales.xlsx"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # Load Excel
        raw = pd.read_excel(file_location)
        raw["date"] = pd.to_datetime(raw["date"], errors="coerce")  # fix ###### issue

        # Preprocess
        processed = preprocess(raw)

        # Forecast
        result = train_forecast(processed, horizon=3)

        # Return JSON
        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
