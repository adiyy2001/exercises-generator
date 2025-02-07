/* eslint-disable react/prop-types */
import { useState } from 'react';
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Rejestracja fontu z Google Fonts – bezpośredni link do pliku TTF
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
});

// Style dokumentu PDF – ustawiamy font na Roboto
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Roboto',
  },
  header: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    border: '1pt solid black',
    padding: 4,
    textAlign: 'center',
  },
});

// Funkcje generujące dane – przykładowo jak wcześniej
const getRandomNumber = () => Math.floor(100 + Math.random() * 900);
const getRandomNumberExcluding = (exclusions) => {
  let num;
  do {
    num = getRandomNumber();
  } while (exclusions.includes(num));
  return num;
};

const generateData = () => {
  const smallTable = Array.from({ length: 4 }, () =>
    Array.from({ length: 7 }, () => getRandomNumber())
  );
  const smallNumbers = smallTable.flat();

  const bigTable = Array.from({ length: 12 }, () =>
    Array.from({ length: 17 }, () => getRandomNumberExcluding(smallNumbers))
  );

  const totalCells = 12 * 17;
  const positions = Array.from({ length: totalCells }, (_, index) => index);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  smallNumbers.forEach((num, index) => {
    const pos = positions[index];
    const row = Math.floor(pos / 17);
    const col = pos % 17;
    bigTable[row][col] = num;
  });
  return { smallTable, bigTable };
};

const Table = ({ data }) => (
  <View style={styles.table}>
    {data.map((row, rowIndex) => (
      <View style={styles.tableRow} key={rowIndex}>
        {row.map((cell, cellIndex) => (
          <Text style={styles.tableCell} key={cellIndex}>
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

const MyDocument = ({ smallTable, bigTable }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.header}>Generator Tablic Liczb 3-Znakowych</Text>
      <Text> tabela (4x7):</Text>
      <Table data={smallTable} />
      <Text> tabela (12x17):</Text>
      <Table data={bigTable} />
    </Page>
  </Document>
);

function App() {
  const [data, setData] = useState(null);

  const handleGenerate = () => {
    const { smallTable, bigTable } = generateData();
    setData({ smallTable, bigTable });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Generator Tablic Liczb 3-Znakowych</h1>
      <button onClick={handleGenerate}>Generuj dane</button>
      {data && (
        <div style={{ marginTop: '20px' }}>
          <PDFDownloadLink
            document={
              <MyDocument
                smallTable={data.smallTable}
                bigTable={data.bigTable}
              />
            }
            fileName="generated_table.pdf"
            style={{
              textDecoration: 'none',
              padding: '10px',
              color: '#4a4a4a',
              border: '1px solid #4a4a4a',
            }}
          >
            {({ loading }) =>
              loading ? 'Trwa generowanie PDF...' : 'Pobierz wygenerowany PDF'
            }
          </PDFDownloadLink>
        </div>
      )}
    </div>
  );
}

export default App;
