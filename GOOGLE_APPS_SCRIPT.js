/**
 * CONFIGURACIÓ
 */
const SOURCE_SPREADSHEET_ID = '1cg_SEw4vEe8iipuoE-j311rK1dkLASZhfn1dkNryULM';
const DESTINATION_SHEET_NAME = 'Sheet1';

/**
 * RECEPTOR API (doPost)
 * Aquesta funció rep les dades de l'app mòbil a l'instant.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // Espera fins a 30 segons per obtenir el bloqueig (evita pèrdua de dades en rush)
    lock.waitLock(30000); 
    
    const dades = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    
    // Escriu una nova fila al final
    sheet.appendRow([dades.fecha, dades.hora, dades.id]);
    
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}

/**
 * SINCRONITZACIÓ SEGURA
 * Versió millorada amb bloqueig per evitar que es netegi el full mentre un altre escriu.
 */
function syncDataFromSource() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const sourceSs = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const sourceData = sourceSs.getSheets()[0].getDataRange().getValues();
    
    const destSs = SpreadsheetApp.getActiveSpreadsheet();
    const destSheet = destSs.getSheetByName(DESTINATION_SHEET_NAME) || destSs.insertSheet(DESTINATION_SHEET_NAME);
    
    destSheet.clear();
    if (sourceData.length > 0) {
      destSheet.getRange(1, 1, sourceData.length, sourceData[0].length).setValues(sourceData);
    }
    
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}