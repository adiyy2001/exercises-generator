/* eslint-disable react/prop-types */
import { useState } from 'react';
import { pdf, Document, Page, Text, View } from '@react-pdf/renderer';

// Simplified PDF styles for better performance
const createPdfStyles = (config) => {
  // Use fewer computed styles and simpler objects
  return {
    page: {
      padding: 30,
      backgroundColor: '#ffffff',
    },
    header: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
      color: '#1a365d',
    },
    subtitle: {
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 15,
      color: '#4a5568',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#2d3748',
      backgroundColor: '#edf2f7',
      padding: 4,
      borderRadius: 2,
    },
    tableContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: 8,
    },
    tableStats: {
      fontSize: 10,
      color: '#4a5568',
      marginBottom: 5,
    },
    table: {
      borderColor: '#e2e8f0',
      borderWidth: 1,
    },
    tableRow: {
      flexDirection: 'row',
    },
    tableCell: {
      width: config.cellWidth || 28,
      height: config.cellHeight || 28,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 1,
      borderWidth: config.borderWidth || 1,
      borderColor: config.borderColor || '#cbd5e0',
      backgroundColor: config.cellBackground || '#ffffff',
    },
    cellText: {
      fontSize: config.fontSize || 10,
      textAlign: 'center',
      color: config.textColor || '#2d3748',
    },
    smallTableCell: {
      width: config.cellWidth || 28,
      height: config.cellHeight || 28,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 1,
      borderWidth: config.borderWidth || 1,
      borderColor: config.borderColor || '#cbd5e0',
      backgroundColor: config.smallTableCellBackground || '#ebf8ff',
    },
    smallTableText: {
      fontSize: config.fontSize || 10,
      fontWeight: 'bold',
      textAlign: 'center',
      color: config.smallTableTextColor || '#2b6cb0',
    },
    trackedCell: {
      backgroundColor: config.trackedCellBackground || '#e6fffa',
    },
    trackedCellText: {
      fontWeight: 'bold',
      color: config.trackedCellTextColor || '#319795',
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      fontSize: 8,
      color: '#718096',
      textAlign: 'center',
    },
    pageNumber: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      fontSize: 8,
      color: '#a0aec0',
    },
    legend: {
      marginTop: 10,
      padding: 5,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 3,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    legendBox: {
      width: 10,
      height: 10,
      marginRight: 4,
    },
    legendText: {
      fontSize: 8,
      color: '#4a5568',
    },
  };
};

// Optimized generate table data function
const generateData = (config) => {
  const minNumber = config.minNumber || 100;
  const maxNumber = config.maxNumber || 999;
  
  const smallRows = config.smallTableRows || 4;
  const smallCols = config.smallTableCols || 7;
  
  const largeRows = config.largeTableRows || 12;
  const largeCols = config.largeTableCols || 17;

  // Use a set for faster lookups (much faster than array.includes for large datasets)
  const smallNumbersSet = new Set();
  const smallTable = [];
  
  // Generate small table
  for (let i = 0; i < smallRows; i++) {
    const row = [];
    for (let j = 0; j < smallCols; j++) {
      const num = Math.floor(minNumber + Math.random() * (maxNumber - minNumber + 1));
      row.push(num);
      smallNumbersSet.add(num);
    }
    smallTable.push(row);
  }
  
  // Convert to array for other operations
  const smallNumbers = Array.from(smallNumbersSet);
  
  // Pre-generate a pool of valid numbers for the big table (not in smallNumbersSet)
  // This is much faster than repeatedly generating and checking
  const validNumbersPool = [];
  const poolSize = largeRows * largeCols * 2; // Generate a pool 2x the size we need
  
  for (let i = 0; i < poolSize && validNumbersPool.length < poolSize; i++) {
    const num = Math.floor(minNumber + Math.random() * (maxNumber - minNumber + 1));
    if (!smallNumbersSet.has(num)) {
      validNumbersPool.push(num);
    }
  }
  
  // Generate big table with pre-validated numbers
  const bigTable = [];
  let poolIndex = 0;
  
  for (let i = 0; i < largeRows; i++) {
    const row = [];
    for (let j = 0; j < largeCols; j++) {
      // Use numbers from the pool (much faster than checking each time)
      row.push(validNumbersPool[poolIndex++ % validNumbersPool.length]);
    }
    bigTable.push(row);
  }
  
  // Initialize tracked cells
  const trackedCells = Array(largeRows).fill().map(() => Array(largeCols).fill(false));
  
  // Place small table numbers in the large table
  if (config.includeSmallTableNumbers) {
    // More efficient position generation
    const positions = [];
    const totalCells = largeRows * largeCols;
    
    // Generate just the positions we need instead of shuffling all positions
    const numbersToPick = Math.min(smallNumbers.length, config.numbersToInclude || smallNumbers.length);
    
    // Create a set to track used positions
    const usedPositions = new Set();
    
    for (let i = 0; i < numbersToPick; i++) {
      let pos;
      do {
        pos = Math.floor(Math.random() * totalCells);
      } while (usedPositions.has(pos));
      
      usedPositions.add(pos);
      positions.push(pos);
    }
    
    // Place numbers in the randomly selected positions
    for (let i = 0; i < numbersToPick; i++) {
      const pos = positions[i];
      const row = Math.floor(pos / largeCols);
      const col = pos % largeCols;
      bigTable[row][col] = smallNumbers[i];
      trackedCells[row][col] = true;
    }
  }
  
  return { smallTable, bigTable, trackedCells };
};


// PDF table component without highlighting tracked cells
const SimpleTable = ({ data, tracked, styles, isSmallTable }) => (
  <View style={styles.table}>
    {data.map((row, rowIndex) => (
      <View style={styles.tableRow} key={rowIndex}>
        {row.map((cell, cellIndex) => {
          // Apply different styling for small table cells, but no special styling for tracked cells
          const cellStyle = isSmallTable ? styles.smallTableCell : styles.tableCell;
          const textStyle = isSmallTable ? styles.smallTableText : styles.cellText;
          
          return (
            <View style={cellStyle} key={cellIndex}>
              <Text style={textStyle}>{cell}</Text>
            </View>
          );
        })}
      </View>
    ))}
  </View>
);

// Basic PDF Document
const SchultePdf = ({ data, config }) => {
  const styles = createPdfStyles(config);
  const title = config.title || "Tablica Schulte";
  const smallTableTitle = config.smallTableTitle || "Tablica wzorcowa";
  const largeTableTitle = config.largeTableTitle || "Tablica główna";
  
  return (
    <Document>
      <Page 
        size={config.pageSize || "A4"} 
        orientation={config.pageOrientation || "portrait"}
        style={styles.page}
      >
        <Text style={styles.header}>{title}</Text>
        
        {config.subtitle && (
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        )}
        
        {config.showSmallTable && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{smallTableTitle}</Text>
            <Text style={styles.tableStats}>
              Wymiary: {data.smallTable.length} × {data.smallTable[0].length} | 
              Zakres liczb: {config.minNumber} - {config.maxNumber}
            </Text>
            
            <SimpleTable 
              data={data.smallTable} 
              styles={styles} 
              isSmallTable={true} 
            />
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{largeTableTitle}</Text>
          <Text style={styles.tableStats}>
            Wymiary: {data.bigTable.length} × {data.bigTable[0].length} | 
            Zakres liczb: {config.minNumber} - {config.maxNumber}
            {config.includeSmallTableNumbers && ` | Umieszczono ${Math.min(data.smallTable.length * data.smallTable[0].length, config.numbersToInclude)} liczb z tablicy wzorcowej`}
          </Text>
          
          <SimpleTable 
            data={data.bigTable}
            styles={styles} 
            isSmallTable={false} 
          />
        </View>
        
        {/* Remove legend since tracking is no longer visible in PDF */}
        
        {config.showFooter && (
          <Text style={styles.footer}>
            {config.footerText || "Wygenerowano przez Generator Tablic Schulte"}
          </Text>
        )}
        
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </Page>
    </Document>
  );
};

function FindNumbers() {
  // Modern color schemes
  const colorSchemes = {
    blue: {
      primary: '#3182ce',
      secondary: '#63b3ed',
      accent: '#4299e1',
      text: '#2d3748',
      lightText: '#718096',
      background: '#f7fafc',
      headerColor: '#2c5282',
      cardBackground: '#ffffff',
      borderColor: '#e2e8f0',
      smallTableCellBackground: '#ebf8ff',
      smallTableTextColor: '#2b6cb0',
      trackedCellBackground: '#e6fffa',
      trackedCellTextColor: '#319795',
    },
    teal: {
      primary: '#319795',
      secondary: '#4fd1c5',
      accent: '#38b2ac',
      text: '#2d3748',
      lightText: '#718096',
      background: '#f0fff4',
      headerColor: '#234e52',
      cardBackground: '#ffffff',
      borderColor: '#e2e8f0',
      smallTableCellBackground: '#e6fffa',
      smallTableTextColor: '#2c7a7b',
      trackedCellBackground: '#ebf8ff',
      trackedCellTextColor: '#2b6cb0',
    },
    purple: {
      primary: '#805ad5',
      secondary: '#b794f4',
      accent: '#9f7aea',
      text: '#2d3748',
      lightText: '#718096',
      background: '#faf5ff',
      headerColor: '#553c9a',
      cardBackground: '#ffffff',
      borderColor: '#e2e8f0',
      smallTableCellBackground: '#f3e8ff',
      smallTableTextColor: '#6b46c1',
      trackedCellBackground: '#ebf8ff',
      trackedCellTextColor: '#2b6cb0',
    },
    dark: {
      primary: '#4a5568',
      secondary: '#a0aec0',
      accent: '#718096',
      text: '#e2e8f0',
      lightText: '#cbd5e0',
      background: '#1a202c',
      headerColor: '#f7fafc',
      cardBackground: '#2d3748',
      borderColor: '#4a5568',
      smallTableCellBackground: '#2c5282',
      smallTableTextColor: '#90cdf4',
      trackedCellBackground: '#285e61',
      trackedCellTextColor: '#9ae6b4',
    }
  };

  // Default configuration
  const defaultConfig = {
    // Table dimensions
    smallTableRows: 4,
    smallTableCols: 7,
    largeTableRows: 12,
    largeTableCols: 17,
    
    // Number range
    minNumber: 100,
    maxNumber: 999,
    
    // Cell appearance
    cellWidth: 30,
    cellHeight: 30,
    cellPadding: 4,
    fontSize: 12,
    borderWidth: 1,
    
    // Colors (will be populated from selected color scheme)
    borderColor: '#cbd5e0',
    textColor: '#2d3748',
    cellBackground: '#ffffff',
    trackedCellBackground: '#e6fffa',
    trackedCellTextColor: '#319795',
    smallTableCellBackground: '#ebf8ff',
    smallTableTextColor: '#2b6cb0',
    
    // Page settings
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pagePadding: 30,
    
    // Text and titles
    title: "Tablice Schulte",
    subtitle: "Narzędzie do treningu pamięci i koncentracji wzrokowej",
    smallTableTitle: "Tablica wzorcowa",
    largeTableTitle: "Tablica główna",
    
    // Features
    showSmallTable: true,
    showFooter: true,
    showLegend: true,
    includeSmallTableNumbers: true,
    numbersToInclude: 28,
    footerText: "© Generator Tablic Schulte",
    
    // Color scheme
    colorScheme: 'blue',
  };
  
  const [config, setConfig] = useState(defaultConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [colorScheme, setColorScheme] = useState('blue');
  
  // Apply color scheme
  const colors = colorSchemes[colorScheme];
  
  // Handle configuration changes
  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) : value
    });
  };
  
  // Change color scheme
  const changeColorScheme = (scheme) => {
    setColorScheme(scheme);
    setConfig({
      ...config,
      colorScheme: scheme,
      borderColor: colorSchemes[scheme].borderColor,
      textColor: colorSchemes[scheme].text,
      headerColor: colorSchemes[scheme].headerColor,
      cellBackground: colorSchemes[scheme].cardBackground,
      smallTableCellBackground: colorSchemes[scheme].smallTableCellBackground,
      smallTableTextColor: colorSchemes[scheme].smallTableTextColor,
      trackedCellBackground: colorSchemes[scheme].trackedCellBackground,
      trackedCellTextColor: colorSchemes[scheme].trackedCellTextColor,
    });
  };
  
  // Generate tables with current config
  const generateTables = () => {
    const data = generateData(config);
    setGeneratedData(data);
  };
  
  // Generate and download PDF with optimization
  const handleGeneratePDF = async () => {
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '0';
    loadingElement.style.left = '0';
    loadingElement.style.width = '100%';
    loadingElement.style.height = '100%';
    loadingElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingElement.style.display = 'flex';
    loadingElement.style.alignItems = 'center';
    loadingElement.style.justifyContent = 'center';
    loadingElement.style.zIndex = '9999';
    loadingElement.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
        <div>Generowanie PDF...</div>
        <div style="margin-top: 10px; height: 5px; background: #f0f0f0; border-radius: 5px; overflow: hidden;">
          <div id="progress-bar" style="height: 100%; width: 0%; background: ${colors.primary}; transition: width 0.3s;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingElement);
    
    const updateProgress = (percent) => {
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) progressBar.style.width = `${percent}%`;
    };
    
    try {
      updateProgress(10);
      
      // Generate data if not already generated
      const data = generatedData || generateData(config);
      updateProgress(30);
      
      // Generate PDF with full config
      try {
        const blob = await pdf(
          <SchultePdf data={data} config={config} />
        ).toBlob();
        
        updateProgress(80);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = config.filename || 'tablica_schulte.pdf';
        
        updateProgress(90);
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(loadingElement);
      } catch (error) {
        console.error("Error generating PDF:", error);
        document.body.removeChild(loadingElement);
        alert("Wystąpił błąd podczas generowania PDF. Spróbuj ponownie z mniejszą tablicą.");
      }
    } catch (error) {
      console.error("Error in PDF generation:", error);
      document.body.removeChild(loadingElement);
      alert("Wystąpił błąd podczas generowania danych. Spróbuj ponownie.");
    }
  };

  // UI Styles
  const uiStyles = {
    container: {
      padding: '30px',
      fontFamily: '"Inter", sans-serif',
      backgroundColor: colors.background,
      minHeight: '100vh',
      color: colors.text,
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: colors.headerColor,
      margin: '0 0 10px 0',
      fontFamily: '"Poppins", sans-serif',
    },
    subtitle: {
      fontSize: '16px',
      color: colors.lightText,
      margin: '0',
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginBottom: '30px',
      overflow: 'hidden',
    },
    cardHeader: {
      backgroundColor: colors.primary,
      color: 'white',
      padding: '15px 20px',
      fontWeight: 'bold',
      fontSize: '18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardBody: {
      padding: '20px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: colors.text,
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '6px',
      border: `1px solid ${colors.borderColor}`,
      backgroundColor: 'white',
      color: colors.text,
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    select: {
      width: '100%',
      padding: '10px',
      borderRadius: '6px',
      border: `1px solid ${colors.borderColor}`,
      backgroundColor: 'white',
      color: colors.text,
      outline: 'none',
    },
    checkbox: {
      marginRight: '10px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      marginTop: '20px',
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s',
      fontSize: '16px',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
      color: 'white',
    },
    dangerButton: {
      backgroundColor: '#f56565',
      color: 'white',
    },
    colorSchemeSelector: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
    },
    colorOption: {
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'transform 0.2s',
    },
    activeColorOption: {
      border: '2px solid white',
      transform: 'scale(1.1)',
    },
    tabs: {
      display: 'flex',
      borderBottom: `1px solid ${colors.borderColor}`,
      marginBottom: '20px',
    },
    tab: {
      padding: '12px 20px',
      cursor: 'pointer',
      borderBottom: '3px solid transparent',
      fontWeight: '500',
      transition: 'border-color 0.2s',
    },
    activeTab: {
      borderBottomColor: colors.primary,
      color: colors.primary,
      fontWeight: '600',
    },
    previewContainer: {
      marginTop: '40px',
    },
    previewHeader: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: colors.headerColor,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      overflow: 'auto',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    tableTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: colors.primary,
    },
    table: {
      display: 'flex',
      flexDirection: 'column',
      border: `1px solid ${colors.borderColor}`,
      borderRadius: '4px',
      overflow: 'hidden',
      width: 'fit-content',
    },
    tableRow: {
      display: 'flex',
    },
    tableCell: {
      width: `${config.cellWidth}px`,
      height: `${config.cellHeight}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `${config.borderWidth}px solid ${colors.borderColor}`,
      backgroundColor: colors.cardBackground,
      color: colors.text,
      fontSize: `${config.fontSize}px`,
    },
    smallTableCell: {
      width: `${config.cellWidth}px`,
      height: `${config.cellHeight}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `${config.borderWidth}px solid ${colors.borderColor}`,
      backgroundColor: colors.smallTableCellBackground,
      color: colors.smallTableTextColor,
      fontSize: `${config.fontSize}px`,
      fontWeight: 'bold',
    },
    trackedCell: {
      backgroundColor: colors.trackedCellBackground,
      color: colors.trackedCellTextColor,
      fontWeight: 'bold',
    },
    tableStatsInfo: {
      fontSize: '14px',
      color: colors.lightText,
      marginBottom: '15px',
      fontStyle: 'italic',
    },
    legend: {
      display: 'flex',
      gap: '20px',
      marginTop: '15px',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    legendBox: {
      width: '16px',
      height: '16px',
      borderRadius: '3px',
      border: `1px solid ${colors.borderColor}`,
    },
    legendText: {
      fontSize: '14px',
      color: colors.lightText,
    },
    slider: {
      width: '100%',
      height: '5px',
      borderRadius: '5px',
      appearance: 'none',
      backgroundColor: colors.borderColor,
      outline: 'none',
    },
  };
  
  return (
    <div style={uiStyles.container}>
      <div style={uiStyles.header}>
        <h1 style={uiStyles.title}>{config.title}</h1>
        <p style={uiStyles.subtitle}>{config.subtitle}</p>
        
        <div style={uiStyles.colorSchemeSelector}>
          {Object.keys(colorSchemes).map(scheme => (
            <div 
              key={scheme}
              onClick={() => changeColorScheme(scheme)}
              style={{
                ...uiStyles.colorOption,
                ...(colorScheme === scheme && uiStyles.activeColorOption),
                backgroundColor: colorSchemes[scheme].primary
              }}
              title={`Schemat kolorów: ${scheme}`}
            ></div>
          ))}
        </div>
      </div>
      
      <div style={uiStyles.card}>
        <div style={uiStyles.cardHeader}>
          <span>Konfiguracja tablicy</span>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              ...uiStyles.button,
              padding: '6px 12px',
              fontSize: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            {showAdvanced ? 'Ukryj zaawansowane' : 'Pokaż zaawansowane opcje'}
          </button>
        </div>
        
        <div style={uiStyles.cardBody}>
          <div style={uiStyles.tabs}>
            <div 
              style={{
                ...uiStyles.tab,
                ...(activeTab === 'basic' && uiStyles.activeTab)
              }}
              onClick={() => setActiveTab('basic')}
            >
              Podstawowe
            </div>
            <div 
              style={{
                ...uiStyles.tab,
                ...(activeTab === 'appearance' && uiStyles.activeTab)
              }}
              onClick={() => setActiveTab('appearance')}
            >
              Wygląd
            </div>
            {showAdvanced && (
              <div 
                style={{
                  ...uiStyles.tab,
                  ...(activeTab === 'advanced' && uiStyles.activeTab)
                }}
                onClick={() => setActiveTab('advanced')}
              >
                Zaawansowane
              </div>
            )}
          </div>
          
          {activeTab === 'basic' && (
            <div style={uiStyles.formGrid}>
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Wymiary tablic</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Wiersze małej tablicy:</label>
                  <input
                    type="number"
                    name="smallTableRows"
                    value={config.smallTableRows}
                    onChange={handleConfigChange}
                    min="1"
                    max="20"
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Kolumny małej tablicy:</label>
                  <input
                    type="number"
                    name="smallTableCols"
                    value={config.smallTableCols}
                    onChange={handleConfigChange}
                    min="1"
                    max="20"
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Wiersze głównej tablicy:</label>
                  <input
                    type="number"
                    name="largeTableRows"
                    value={config.largeTableRows}
                    onChange={handleConfigChange}
                    min="1"
                    max="30"
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Kolumny głównej tablicy:</label>
                  <input
                    type="number"
                    name="largeTableCols"
                    value={config.largeTableCols}
                    onChange={handleConfigChange}
                    min="1"
                    max="30"
                    style={uiStyles.input}
                  />
                </div>
              </div>
              
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Zakres liczb</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Minimalna wartość:</label>
                  <input
                    type="number"
                    name="minNumber"
                    value={config.minNumber}
                    onChange={handleConfigChange}
                    min="0"
                    max="9999"
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Maksymalna wartość:</label>
                  <input
                    type="number"
                    name="maxNumber"
                    value={config.maxNumber}
                    onChange={handleConfigChange}
                    min="0"
                    max="9999"
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="includeSmallTableNumbers"
                      checked={config.includeSmallTableNumbers}
                      onChange={handleConfigChange}
                      style={uiStyles.checkbox}
                    />
                    Umieść liczby z małej tablicy w głównej
                  </label>
                </div>
                
                {config.includeSmallTableNumbers && (
                  <div style={uiStyles.formGroup}>
                    <label style={uiStyles.label}>Liczba włączonych liczb:</label>
                    <input
                      type="number"
                      name="numbersToInclude"
                      value={config.numbersToInclude}
                      onChange={handleConfigChange}
                      min="1"
                      max={config.smallTableRows * config.smallTableCols}
                      style={uiStyles.input}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Ustawienia dokumentu</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Format strony:</label>
                  <select
                    name="pageSize"
                    value={config.pageSize}
                    onChange={handleConfigChange}
                    style={uiStyles.select}
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="LETTER">Letter</option>
                    <option value="LEGAL">Legal</option>
                  </select>
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Orientacja:</label>
                  <select
                    name="pageOrientation"
                    value={config.pageOrientation}
                    onChange={handleConfigChange}
                    style={uiStyles.select}
                  >
                    <option value="portrait">Pionowa</option>
                    <option value="landscape">Pozioma</option>
                  </select>
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="showSmallTable"
                      checked={config.showSmallTable}
                      onChange={handleConfigChange}
                      style={uiStyles.checkbox}
                    />
                    Pokaż małą tablicę w PDF
                  </label>
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="showFooter"
                      checked={config.showFooter}
                      onChange={handleConfigChange}
                      style={uiStyles.checkbox}
                    />
                    Pokaż stopkę w PDF
                  </label>
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="showLegend"
                      checked={config.showLegend}
                      onChange={handleConfigChange}
                      style={uiStyles.checkbox}
                    />
                    Pokaż legendę w PDF
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div style={uiStyles.formGrid}>
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Wygląd komórek</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Szerokość komórki ({config.cellWidth}px):</label>
                  <input
                    type="range"
                    name="cellWidth"
                    value={config.cellWidth}
                    onChange={handleConfigChange}
                    min="20"
                    max="60"
                    style={uiStyles.slider}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Wysokość komórki ({config.cellHeight}px):</label>
                  <input
                    type="range"
                    name="cellHeight"
                    value={config.cellHeight}
                    onChange={handleConfigChange}
                    min="20"
                    max="60"
                    style={uiStyles.slider}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Wewnętrzny margines ({config.cellPadding}px):</label>
                  <input
                    type="range"
                    name="cellPadding"
                    value={config.cellPadding}
                    onChange={handleConfigChange}
                    min="1"
                    max="10"
                    style={uiStyles.slider}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Grubość ramki ({config.borderWidth}px):</label>
                  <input
                    type="range"
                    name="borderWidth"
                    value={config.borderWidth}
                    onChange={handleConfigChange}
                    min="1"
                    max="5"
                    style={uiStyles.slider}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Rozmiar czcionki ({config.fontSize}px):</label>
                  <input
                    type="range"
                    name="fontSize"
                    value={config.fontSize}
                    onChange={handleConfigChange}
                    min="8"
                    max="24"
                    style={uiStyles.slider}
                  />
                </div>
              </div>
              
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Kolory</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Kolor ramki:</label>
                  <input
                    type="color"
                    name="borderColor"
                    value={config.borderColor}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Kolor tekstu:</label>
                  <input
                    type="color"
                    name="textColor"
                    value={config.textColor}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Tło komórki:</label>
                  <input
                    type="color"
                    name="cellBackground"
                    value={config.cellBackground}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Tło komórki małej tablicy:</label>
                  <input
                    type="color"
                    name="smallTableCellBackground"
                    value={config.smallTableCellBackground}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Kolor tekstu małej tablicy:</label>
                  <input
                    type="color"
                    name="smallTableTextColor"
                    value={config.smallTableTextColor}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
              </div>
              
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Wyróżnione komórki</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Tło wyróżnionej komórki:</label>
                  <input
                    type="color"
                    name="trackedCellBackground"
                    value={config.trackedCellBackground}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Kolor tekstu wyróżnionej komórki:</label>
                  <input
                    type="color"
                    name="trackedCellTextColor"
                    value={config.trackedCellTextColor}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <h3 style={{color: colors.primary}}>Przykład kolorów</h3>
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                  <div style={{
                    ...uiStyles.tableCell,
                    width: '50px',
                    height: '50px',
                    fontSize: '16px',
                  }}>123</div>
                  
                  <div style={{
                    ...uiStyles.smallTableCell,
                    width: '50px',
                    height: '50px',
                    fontSize: '16px',
                  }}>456</div>
                  
                  <div style={{
                    ...uiStyles.tableCell,
                    ...uiStyles.trackedCell,
                    width: '50px',
                    height: '50px',
                    fontSize: '16px',
                  }}>789</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'advanced' && showAdvanced && (
            <div style={uiStyles.formGrid}>
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Teksty i tytuły</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Tytuł dokumentu:</label>
                  <input
                    type="text"
                    name="title"
                    value={config.title}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Podtytuł:</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={config.subtitle}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Tytuł małej tablicy:</label>
                  <input
                    type="text"
                    name="smallTableTitle"
                    value={config.smallTableTitle}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Tytuł głównej tablicy:</label>
                  <input
                    type="text"
                    name="largeTableTitle"
                    value={config.largeTableTitle}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
              </div>
              
              <div>
                <h3 style={{color: colors.primary, marginTop: 0}}>Eksport</h3>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Nazwa pliku PDF:</label>
                  <input
                    type="text"
                    name="filename"
                    value={config.filename || 'tablica_schulte.pdf'}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Tekst stopki:</label>
                  <input
                    type="text"
                    name="footerText"
                    value={config.footerText}
                    onChange={handleConfigChange}
                    style={uiStyles.input}
                  />
                </div>
                
                <div style={uiStyles.formGroup}>
                  <label style={uiStyles.label}>Margines strony (mm):</label>
                  <input
                    type="number"
                    name="pagePadding"
                    value={config.pagePadding}
                    onChange={handleConfigChange}
                    min="10"
                    max="50"
                    style={uiStyles.input}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div style={uiStyles.buttonGroup}>
            <button 
              onClick={generateTables}
              style={{...uiStyles.button, ...uiStyles.primaryButton}}
            >
              Generuj podgląd
            </button>
            
            <button 
              onClick={handleGeneratePDF}
              style={{...uiStyles.button, ...uiStyles.secondaryButton}}
            >
              Generuj i pobierz PDF
            </button>
            
            <button 
              onClick={() => {
                setConfig(defaultConfig);
                changeColorScheme('blue');
              }}
              style={{...uiStyles.button, ...uiStyles.dangerButton}}
            >
              Resetuj ustawienia
            </button>
          </div>
        </div>
      </div>
      
      {generatedData && (
        <div style={uiStyles.previewContainer}>
          <h2 style={uiStyles.previewHeader}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill={colors.primary}/>
            </svg>
            Podgląd generowanych tablic
          </h2>
          
          {config.showSmallTable && (
            <div style={uiStyles.tableContainer}>
              <h3 style={uiStyles.tableTitle}>{config.smallTableTitle}</h3>
              
              <div style={uiStyles.tableStatsInfo}>
                Wymiary: {generatedData.smallTable.length} × {generatedData.smallTable[0].length} | 
                Zakres liczb: {config.minNumber} - {config.maxNumber}
              </div>
              
              <div style={uiStyles.table}>
                {generatedData.smallTable.map((row, rowIndex) => (
                  <div key={rowIndex} style={uiStyles.tableRow}>
                    {row.map((cell, cellIndex) => (
                      <div 
                        key={cellIndex} 
                        style={uiStyles.smallTableCell}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{...uiStyles.tableContainer, marginTop: '30px'}}>
            <h3 style={uiStyles.tableTitle}>{config.largeTableTitle}</h3>
            
            <div style={uiStyles.tableStatsInfo}>
              Wymiary: {generatedData.bigTable.length} × {generatedData.bigTable[0].length} | 
              Zakres liczb: {config.minNumber} - {config.maxNumber}
              {config.includeSmallTableNumbers && ` | Umieszczono ${Math.min(generatedData.smallTable.length * generatedData.smallTable[0].length, config.numbersToInclude)} liczb z tablicy wzorcowej`}
            </div>
            
            <div style={{
              maxWidth: '100%',
              overflowX: 'auto',
              padding: '10px 0',
            }}>
              <div style={uiStyles.table}>
                {generatedData.bigTable.map((row, rowIndex) => (
                  <div key={rowIndex} style={uiStyles.tableRow}>
                    {row.map((cell, cellIndex) => {
                      const isTracked = generatedData.trackedCells[rowIndex][cellIndex];
                      return (
                        <div 
                          key={cellIndex} 
                          style={{
                            ...uiStyles.tableCell,
                            ...(isTracked && uiStyles.trackedCell)
                          }}
                        >
                          {cell}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {config.includeSmallTableNumbers && (
              <div style={uiStyles.legend}>
                <div style={uiStyles.legendItem}>
                  <div style={{
                    ...uiStyles.legendBox,
                    backgroundColor: colors.smallTableCellBackground
                  }}></div>
                  <span style={uiStyles.legendText}>Liczby z tablicy wzorcowej</span>
                </div>
                
                <div style={uiStyles.legendItem}>
                  <div style={{
                    ...uiStyles.legendBox,
                    backgroundColor: colors.trackedCellBackground
                  }}></div>
                  <span style={uiStyles.legendText}>Liczby z tablicy wzorcowej umieszczone w tablicy głównej</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FindNumbers;