# predict.py
import sys
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

data = [float(x) for x in sys.argv[1:]]

model = ARIMA(data, order=(1, 0, 0))
model_fit = model.fit()
forecast = model_fit.forecast(steps=1)[0]

print(forecast)
