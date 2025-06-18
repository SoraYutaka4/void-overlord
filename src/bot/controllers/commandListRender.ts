import puppeteer from "puppeteer";
import { CM, Command, } from "../types";
import { splitCommands } from "../utils/common";

const COMMANDS_PER_PAGE = 7;

interface CMMNG {
  commandCount: number,
  commands: Command[],
}

const generateTableRows = (manager: CMMNG, start: number, end: number) => {
  return manager.commands.slice(start, end).map((cmd) => `
    <tr>
      <td>${Array.isArray(cmd.name) ? cmd.name[cmd.name.length - 1] : cmd.name}</td>
      <td>${cmd.version}</td>
      <td>${cmd.description}</td>
    </tr>
  `).join("");
};

const getHTML = (manager: CMMNG, pageNum: number, startIndex: number, endIndex: number) => `
<html>
<head>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #e0c3fc, #8ec5fc);
      }
      table {
        width: 85%;
        border-collapse: collapse;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border-radius: 12px;
        overflow: hidden;
        background: white;
        backdrop-filter: blur(5px);
      }
      th, td {
        padding: 16px;
        text-align: center;
        border-bottom: 1px solid #eee;
      }
      th {
        background: linear-gradient(to right, #6a11cb, #2575fc);
        color: white;
        text-transform: uppercase;
        font-weight: 600;
      }
      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      td:nth-child(1) { color: #9900ff; font-weight: 500; }
      td:nth-child(2) { color: #ff5392; font-weight: 600; }
      td:nth-child(3) { color: #007bff; }
      .page-number {
        text-align: center;
        margin-top: 10px;
        font-size: 18px;
        font-weight: bold;
        color: #444;
      }
    </style>
</head>
<body>
    <table>
        <tr>
            <th>Lệnh</th>
            <th>Phiên bản</th>
            <th>Mô tả</th>
        </tr>
        ${generateTableRows(manager, startIndex, endIndex)}
    </table>
    <div class="page-number">Trang ${pageNum}</div>
</body>
</html>
`;

/**
 * Export the command list as paginated table images
 * @param manager Command Manager (CM) object
 * @param saveLocation Path to save the output images
 */
const exportCommandTable = async (manager: CM, saveLocation: string) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });

  try {
    const filteredCommand = splitCommands(manager.commands).public;
    const totalCommands = filteredCommand.length;
    const totalPages = Math.ceil(totalCommands / COMMANDS_PER_PAGE);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIndex = pageNum * COMMANDS_PER_PAGE;
      const endIndex = Math.min(startIndex + COMMANDS_PER_PAGE, totalCommands);

      const page = await browser.newPage();
      await page.setContent(getHTML({
        commandCount: totalCommands,
        commands: filteredCommand,
      }, pageNum + 1, startIndex, endIndex), {
        waitUntil: "domcontentloaded"
      });

      try {
        await page.waitForSelector("table", { visible: true, timeout: 2000 });
        const table = await page.$("table");

        if (!table) throw new Error("Table not found!");

        const filePath = `${saveLocation}_page${pageNum + 1}.png`;
        await table.screenshot({ path: filePath });
        console.log(`✅ Saved table image: ${filePath}`);
      } catch (err) {
        if (err instanceof Error) {
          console.error(`❌ Error on page ${pageNum + 1}:`, err.message);
        } else {
          console.error(`❌ Error on page ${pageNum + 1}:`, err);
        }
      } finally {
        await page.close();
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("❌ Failed to export table:", err.message);
    } else {
      console.error("❌ Failed to export table:", err);
    }
  } finally {
    await browser.close();
  }
};

export default exportCommandTable;