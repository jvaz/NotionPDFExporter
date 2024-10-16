# NotionPDFExporter

NotionPDFExporter is a Google Apps Script project that allows you to export Notion pages (including all subpages) to PDF format and save them in a specified Google Drive folder.

## Features

- Fetches content from Notion pages and subpages
- Converts Notion blocks to HTML, maintaining formatting and structure
- Generates a PDF from the converted HTML
- Saves the PDF to a specified Google Drive folder
- Handles various Notion block types including paragraphs, headings, lists, images, tables, callouts, toggles, and more
- Includes error handling to ensure the script continues even if some blocks fail to convert
- Adds the current date (YYYYMMDD format) to the exported PDF filename

## Prerequisites

1. A Google account
2. Access to Google Apps Script
3. A Notion account with API access
4. A Notion API token
5. The ID of the Notion page you want to export
6. The ID of the Google Drive folder where you want to save the PDF

## Setup

1. Go to [Google Apps Script](https://script.google.com/) and create a new project.
2. Copy the entire content of the `Code.gs` file into the script editor.
3. Replace the placeholder values in the configurable variables section at the top of the script:
   - `NOTION_API_TOKEN`: Your Notion API token
   - `ROOT_PAGE_ID`: The ID of the Notion page you want to export
   - `DRIVE_FOLDER_ID`: The ID of the Google Drive folder where the PDF will be saved

## Usage

1. After setting up the script, click on the "Run" button in the Google Apps Script editor to execute the `exportNotionToPDF` function.
2. The script will fetch the content from Notion, convert it to HTML, generate a PDF, and save it to the specified Google Drive folder.
3. Check the execution log for any error messages or the final "PDF saved successfully" message with the file ID.
4. The exported PDF will be named `Notion_Export_YYYYMMDD.pdf`, where YYYYMMDD is the current date.

## Limitations

- The script may not perfectly replicate all Notion formatting and block types.
- Large Notion pages with many subpages may take some time to process.
- The script is subject to Google Apps Script quotas and Notion API rate limits.
- Some complex block types (like nested tables or deeply nested toggles) may require additional processing.

## Troubleshooting

If you encounter any issues:
1. Check the execution log in the Google Apps Script editor for error messages.
2. Ensure your Notion API token has the necessary permissions.
3. Verify that the Notion page ID and Google Drive folder ID are correct.
4. If specific block types are not rendering correctly, you may need to modify the `convertBlockToHTML` function to handle them appropriately.
5. For issues with images, check if they are properly linked or if they're using base64 encoding.

## Contributing

Feel free to fork this project and submit pull requests with any enhancements or bug fixes. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
