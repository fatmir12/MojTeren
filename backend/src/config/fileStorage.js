import fs from "fs/promises"

const DATA_PATH = "./src/data/mockData.json"

export async function readData() {
  const data = await fs.readFile(
    DATA_PATH,
    "utf-8"
  )

  return JSON.parse(data)
}

export async function writeData(data) {
  await fs.writeFile(
    DATA_PATH,
    JSON.stringify(data, null, 2)
  )
}