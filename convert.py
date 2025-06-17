# Convert xlxs to JSON 
import pandas as pd

df = pd.read_excel("The Web.xlsx")

df.to_json("graph-data.json", orient="records", indent=2)

print("Excel converted to JSON.")