"""JST/UTC時刻・日付を返すAPIエンドポイント"""

from datetime import datetime, timezone, timedelta

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Time API", version="1.0.0")

JST = timezone(timedelta(hours=9))


class JSTResponse(BaseModel):
    """JST時刻レスポンス"""

    date: str
    time: str
    datetime: str


class UTCResponse(BaseModel):
    """UTC時刻レスポンス"""

    date: str
    time: str
    datetime: str


@app.get("/jst", response_model=JSTResponse)
def get_jst_time() -> JSTResponse:
    """現在のJST時刻と日付を返す"""
    now = datetime.now(JST)
    return JSTResponse(
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M:%S"),
        datetime=now.isoformat(),
    )


@app.get("/utc", response_model=UTCResponse)
def get_utc_time() -> UTCResponse:
    """現在のUTC時刻と日付を返す"""
    now = datetime.now(timezone.utc)
    return UTCResponse(
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M:%S"),
        datetime=now.isoformat(),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
