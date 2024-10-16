// Configurable variables
const NOTION_API_TOKEN = 'secret_wN3aoEjiyyvqK88mm5KSP4IU05YOLzKvGljJUAgs8oJ';
const ROOT_PAGE_ID = '10e45db3-314c-80cc-a301-e0db9643fee7';
const DRIVE_FOLDER_ID = '1jM4PAt079lHH6OCuQHvYByekkrG8YNf5';

function exportNotionToPDF() {
  const notionContent = fetchNotionContent(ROOT_PAGE_ID);
  const html = convertToHTML(notionContent);
  const pdf = generatePDF(html);
  savePDFToDrive(pdf);
}

function fetchNotionContent(blockId) {
  const content = [];
  const blocks = fetchBlocks(blockId);
  
  for (const block of blocks) {
    content.push(block);
    
    if (block.type === 'child_page' || block.type === 'link_to_page') {
      const subpageId = block.type === 'child_page' ? block.id : block[block.type].page_id;
      const subpageContent = fetchNotionContent(subpageId);
      content.push(...subpageContent);
    } else if (block.type === 'table' || block.type === 'toggle') {
      const childContent = fetchNotionContent(block.id);
      block.children = childContent;
    }
  }
  
  return content;
}

function fetchBlocks(blockId) {
  const url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${NOTION_API_TOKEN}`,
      'Notion-Version': '2022-06-28'
    }
  };
  
  let allBlocks = [];
  let hasMore = true;
  let startCursor = undefined;
  
  while (hasMore) {
    const response = UrlFetchApp.fetch(url + (startCursor ? `&start_cursor=${startCursor}` : ''), options);
    const responseData = JSON.parse(response.getContentText());
    
    allBlocks = allBlocks.concat(responseData.results);
    hasMore = responseData.has_more;
    startCursor = responseData.next_cursor;
  }
  
  return allBlocks;
}

function convertToHTML(notionContent) {
  let html = '<html><head><style>body{font-family: Arial, sans-serif;}</style></head><body>';
  
  for (const block of notionContent) {
    try {
      html += convertBlockToHTML(block);
    } catch (error) {
      console.error('Error in convertToHTML:', error);
      html += `<p>[Error converting block]</p>`;
    }
  }
  
  html += '</body></html>';
  return html;
}

function convertBlockToHTML(block) {
  try {
    switch (block.type) {
      case 'paragraph':
        return `<p>${convertRichTextToHTML(block.paragraph.rich_text)}</p>`;
      case 'heading_1':
        return `<h1>${convertRichTextToHTML(block.heading_1.rich_text)}</h1>`;
      case 'heading_2':
        return `<h2>${convertRichTextToHTML(block.heading_2.rich_text)}</h2>`;
      case 'heading_3':
        return `<h3>${convertRichTextToHTML(block.heading_3.rich_text)}</h3>`;
      case 'bulleted_list_item':
        return `<ul><li>${convertRichTextToHTML(block.bulleted_list_item.rich_text)}</li></ul>`;
      case 'numbered_list_item':
        return `<ol><li>${convertRichTextToHTML(block.numbered_list_item.rich_text)}</li></ol>`;
      case 'to_do':
        const checked = block.to_do.checked ? 'checked' : '';
        return `<div><input type="checkbox" ${checked} disabled> ${convertRichTextToHTML(block.to_do.rich_text)}</div>`;
      case 'quote':
        return `<blockquote>${convertRichTextToHTML(block.quote.rich_text)}</blockquote>`;
      case 'code':
        return `<pre><code>${convertRichTextToHTML(block.code.rich_text)}</code></pre>`;
      case 'image':
        if (block.image.type === 'file') {
          return `<img src="${block.image.file.url}" alt="Image">`;
        } else if (block.image.type === 'external') {
          return `<img src="${block.image.external.url}" alt="Image">`;
        } else if (block.image.caption && block.image.caption.length > 0) {
          // If there's no URL but there's a caption, it might be a base64 encoded image
          const caption = convertRichTextToHTML(block.image.caption);
          if (caption.startsWith('data:image')) {
            return `<img src="${caption}" alt="Base64 Encoded Image">`;
          }
        }
        return '<p>[Image: Unable to display]</p>';
      case 'divider':
        return '<hr>';
      case 'child_page':
        return `<h2>${block.child_page.title}</h2>`;
      case 'link_to_page':
        return `<p>Link to page: ${block.link_to_page.page_id}</p>`;
      case 'table_of_contents':
        return '<p>[Table of Contents: Generated in final PDF]</p>';
      case 'table':
        let tableHtml = '<table border="1">';
        if (block.table.has_column_header) {
          tableHtml += '<thead><tr>';
          for (let i = 0; i < block.table.table_width; i++) {
            tableHtml += '<th>[Header]</th>';
          }
          tableHtml += '</tr></thead>';
        }
        tableHtml += '<tbody>';
        for (let i = 0; i < block.table.has_row_header ? block.table.table_width - 1 : block.table.table_width; i++) {
          tableHtml += '<tr>';
          for (let j = 0; j < block.table.table_width; j++) {
            tableHtml += '<td>[Cell Content]</td>';
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        return tableHtml;
      case 'callout':
        return `<div style="background-color: #f0f0f0; padding: 10px; border-left: 5px solid #ccc;">
                  ${block.callout.icon ? `<span>${block.callout.icon.emoji}</span>` : ''}
                  ${convertRichTextToHTML(block.callout.rich_text)}
                </div>`;
      case 'toggle':
        return `<details>
                  <summary>${convertRichTextToHTML(block.toggle.rich_text)}</summary>
                  <div>[Toggle content]</div>
                </details>`;
      default:
        console.log(`Unsupported block type: ${block.type}`);
        return `<p>[Unsupported block type: ${block.type}]</p>`;
    }
  } catch (error) {
    console.error(`Error converting block of type ${block.type}:`, error);
    console.log('Problematic block:', JSON.stringify(block, null, 2));
    return `<p>[Error converting block of type: ${block.type}]</p>`;
  }
}

function convertRichTextToHTML(richText) {
  if (!Array.isArray(richText)) {
    // If richText is not an array, it might be a string (possibly a base64 encoded image)
    return richText;
  }
  return richText.map(text => {
    let content = text.plain_text;
    if (text.annotations.bold) content = `<strong>${content}</strong>`;
    if (text.annotations.italic) content = `<em>${content}</em>`;
    if (text.annotations.strikethrough) content = `<del>${content}</del>`;
    if (text.annotations.underline) content = `<u>${content}</u>`;
    if (text.annotations.code) content = `<code>${content}</code>`;
    if (text.href) content = `<a href="${text.href}">${content}</a>`;
    return content;
  }).join('');
}

function generatePDF(html) {
  Logger.log('Generating PDF from HTML');
  
  // Create a temporary HTML file
  const htmlFile = DriveApp.createFile('temp.html', html, MimeType.HTML);
  
  // Convert HTML to PDF
  const blob = DriveApp.getFileById(htmlFile.getId()).getAs(MimeType.PDF);
  
  // Delete the temporary HTML file
  DriveApp.getFileById(htmlFile.getId()).setTrashed(true);
  
  // Get current date in YYYYMMDD format
  const date = new Date();
  const dateString = Utilities.formatDate(date, 'GMT', 'yyyyMMdd');
  
  // Set the PDF file name with the date
  blob.setName(`Notion_Export_${dateString}.pdf`);
  
  return blob;
}

function savePDFToDrive(pdfBlob) {
  Logger.log('Saving PDF to Google Drive');
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const file = folder.createFile(pdfBlob);
  Logger.log('PDF saved successfully. File ID: ' + file.getId());
}
