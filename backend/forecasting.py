import warnings, os, math, json
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error

warnings.filterwarnings("ignore", category=FutureWarning)

# Prophet fallback
try:
    from prophet import Prophet
    use_prophet = True
except Exception:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    use_prophet = False

# -------------------------------
# Load data
# -------------------------------
def load_data(data_path, test_path=None):
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"{data_path} not found.")
    df = pd.read_csv(data_path, parse_dates=["date"])
    assert "product_code" in df.columns and "sales" in df.columns, "train.csv must have product_code and sales"
    df = df.sort_values(["product_code","date"]).reset_index(drop=True)
    
    test_df = None
    if test_path and os.path.exists(test_path):
        test_df = pd.read_csv(test_path, parse_dates=["date"])
        test_df = test_df.sort_values(["product_code","date"]).reset_index(drop=True)
    
    return df, test_df

# -------------------------------
# Preprocessing
# -------------------------------
def preprocess_panel(df):
    df = df.copy()
    df['date'] = pd.to_datetime(df['date']).dt.to_period('M').dt.to_timestamp()
    global_min = df['date'].min()
    global_max = df['date'].max()
    all_months = pd.date_range(global_min, global_max, freq='MS')

    processed = []
    for prod, g in df.groupby('product_code', sort=False):
        g = g.set_index('date').sort_index()
        g = g.reindex(all_months)
        g['product_code'] = prod
        
        # Sales filling
        if 'sales' in g.columns:
            g['sales'] = g['sales'].fillna(g['sales'].rolling(3,min_periods=1).mean())
            month_avg = g.groupby(g.index.month)['sales'].transform('mean')
            g['sales'] = g['sales'].fillna(month_avg)
            g['sales'] = g['sales'].interpolate().ffill().bfill()
        
        # Other regressors
        for col in g.columns:
            if col not in ('sales','product_code'):
                g[col] = g[col].interpolate().ffill().bfill()
        
        g = g.reset_index().rename(columns={'index':'date'})
        processed.append(g)

    merged = pd.concat(processed, ignore_index=True)
    cols = ['date','product_code'] + [c for c in merged.columns if c not in ('date','product_code')]
    merged = merged[cols].sort_values(['date','product_code']).reset_index(drop=True)
    return merged

# -------------------------------
# Forecasting
# -------------------------------
def forecast_panel(processed_df, forecast_months, regressors=['mrp','discount','rating']):
    forecasts = []
    for prod, g in processed_df.groupby('product_code'):
        g = g.sort_values('date').reset_index(drop=True)
        if g['sales'].dropna().shape[0] == 0:
            continue
        train = g.copy()
        try:
            if use_prophet:
                m = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
                available_regs = [r for r in regressors if r in train.columns]
                for r in available_regs:
                    m.add_regressor(r)
                train_prop = train.rename(columns={'date':'ds','sales':'y'})[['ds','y'] + available_regs]
                m.fit(train_prop)

                # future frame
                future_index = pd.date_range(train['date'].min(), periods=len(train)+len(forecast_months), freq='MS')
                future = pd.DataFrame({'ds': future_index})
                for r in available_regs:
                    tmp = train[['date', r]].rename(columns={'date':'ds'})
                    future = future.merge(tmp, on='ds', how='left')
                    future[r] = future[r].fillna(method='ffill').fillna(method='bfill')
                preds = m.predict(future[['ds'] + available_regs]).set_index('ds')['yhat']

                for fm in forecast_months:
                    val = preds.get(fm, np.nan)
                    forecasts.append({'date': fm, 'product_code': prod, 'forecast': float(np.nan if pd.isna(val) else val)})
            else:
                if train['sales'].dropna().shape[0] < 12:
                    last_val = float(train['sales'].dropna().iloc[-1]) if train['sales'].dropna().shape[0]>0 else 0.0
                    for fm in forecast_months:
                        forecasts.append({'date': fm, 'product_code': prod, 'forecast': last_val})
                else:
                    model = ExponentialSmoothing(train['sales'], seasonal='add', seasonal_periods=12)
                    fit = model.fit()
                    fc = fit.forecast(len(forecast_months))
                    for i, fm in enumerate(forecast_months):
                        forecasts.append({'date': fm, 'product_code': prod, 'forecast': float(fc[i])})
        except Exception:
            last_val = float(train['sales'].dropna().iloc[-1]) if train['sales'].dropna().shape[0]>0 else 0.0
            for fm in forecast_months:
                forecasts.append({'date': fm, 'product_code': prod, 'forecast': last_val})
    return pd.DataFrame(forecasts).sort_values(['date','product_code']).reset_index(drop=True)

# -------------------------------
# Metrics
# -------------------------------
def smape(a,f):
    a,f = np.array(a,dtype=float), np.array(f,dtype=float)
    denom = (np.abs(a)+np.abs(f))
    with np.errstate(divide='ignore', invalid='ignore'):
        res = np.where(denom==0,0.0,2*np.abs(f-a)/denom)
    return np.nanmean(res)*100.0

def compute_metrics_series(a,f):
    a,f = np.array(a,dtype=float), np.array(f,dtype=float)
    mask = ~np.isnan(a)
    if mask.sum()==0:
        return {'mape':None,'smape':None,'rmse':None,'accuracy':None}
    a,f = a[mask],f[mask]
    nonzero = a!=0
    mape_val = float(np.mean(np.abs((a[nonzero]-f[nonzero])/a[nonzero]))*100.0) if nonzero.sum()>0 else None
    smape_val = float(smape(a,f))
    rmse_val = float(math.sqrt(mean_squared_error(a,f)))
    acc_val = float(100.0 - mape_val) if mape_val is not None else None
    return {'mape': mape_val,'smape': smape_val,'rmse': rmse_val,'accuracy': acc_val}

# -------------------------------
# Main pipeline function
# -------------------------------
def run_forecast(train_file, start_month, end_month, test_file=None):
    # Load
    raw, test_actuals = load_data(train_file, test_file)
    processed = preprocess_panel(raw)
    
    # Forecast months
    FORECAST_START = pd.to_datetime(start_month)
    FORECAST_END = pd.to_datetime(end_month)
    forecast_months = pd.date_range(FORECAST_START, FORECAST_END, freq='MS')
    
    forecasts = forecast_panel(processed, forecast_months)
    
    # Format forecast JSON
    forecasted_products = []
    for d in forecast_months:
        d_str = d.strftime("%Y-%m-%d")
        row = forecasts[forecasts['date']==d]
        forecasted_products.append({d_str: {r['product_code']: round(r['forecast'],2) for _,r in row.iterrows()}})
    
    # Metrics
    metrics = {}
    if test_actuals is not None and not test_actuals.empty:
        test_actuals['date'] = pd.to_datetime(test_actuals['date']).dt.to_period('M').dt.to_timestamp()
        test_window = test_actuals[test_actuals['date'].isin(forecast_months)]
        merged = forecasts.merge(test_window[['date','product_code','sales']], on=['date','product_code'], how='left')
        for prod, g in merged.groupby('product_code'):
            a = g['sales'].values
            f = g['forecast'].values
            metrics[prod] = compute_metrics_series(a,f)
    
    # Aggregated metrics (optional)
    agg_metrics = {}
    if metrics:
        mape_vals = [v['mape'] for v in metrics.values() if v['mape'] is not None]
        smape_vals = [v['smape'] for v in metrics.values() if v['smape'] is not None]
        rmse_vals = [v['rmse'] for v in metrics.values() if v['rmse'] is not None]
        acc_vals = [v['accuracy'] for v in metrics.values() if v['accuracy'] is not None]
        agg_metrics = {
            "mape_mean": float(np.mean(mape_vals)) if mape_vals else None,
            "smape_mean": float(np.mean(smape_vals)) if smape_vals else None,
            "rmse_mean": float(np.mean(rmse_vals)) if rmse_vals else None,
            "accuracy_mean": float(np.mean(acc_vals)) if acc_vals else None,
        }
    
    return {
        "forecasted_products": forecasted_products,
        "metrics": metrics,
        "aggregated_metrics": agg_metrics
    }
