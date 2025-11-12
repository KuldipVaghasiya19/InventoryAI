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

from datetime import datetime
import pandas as pd
import calendar

@app.post("/get_date_range")
async def get_date_range(train_file: UploadFile = File(...)):
    """
    Reads uploaded CSV, detects the last available month,
    and returns the next 6-month range (min & max allowed months).
    """
    # Read uploaded CSV into memory
    content = await train_file.read()
    df = pd.read_csv(pd.io.common.BytesIO(content), parse_dates=["date"])

    # Validate column
    if "date" not in df.columns:
        return {"error": "Missing 'date' column in the uploaded CSV."}

    # Get the latest date in the data
    last_date = pd.to_datetime(df["date"]).max()

    # Normalize to month start
    last_month = pd.Timestamp(year=last_date.year, month=last_date.month, day=1)

    # Compute next 6 months
    start_month = (last_month + pd.offsets.MonthBegin(1)).strftime("%Y-%m")
    end_month = (last_month + pd.offsets.MonthBegin(7)).strftime("%Y-%m")

    # Also return friendly labels if needed
    start_label = (last_month + pd.offsets.MonthBegin(1)).strftime("%B %Y")
    end_label = (last_month + pd.offsets.MonthBegin(7)).strftime("%B %Y")

    return {
        "last_data_month": last_month.strftime("%Y-%m"),
        "allowed_start_month": start_month,
        "allowed_end_month": end_month,
        "display_range": f"{start_label} → {end_label}"
    }


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
    
    # Use the existing test.csv in the dummydata folder
    test_path = "dummydata/test.csv" if os.path.exists("dummydata/test.csv") else None
    
    # Run forecast
    result = run_forecast(train_path, start_month, end_month, test_path)
    
    # Clean up temporary train file if needed
    # os.remove(train_path)
    
    return result