import pandas as pd

# Replace this with your Excel filename
df = pd.read_excel("The Web.xlsx")

# Output as a JSON file
df.to_json("graph-data.json", orient="records", indent=2)

print("Excel converted to JSON successfully.")