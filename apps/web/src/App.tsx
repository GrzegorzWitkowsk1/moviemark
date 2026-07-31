import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Authorized from './views/authorized';
import Unauthorized from './views/unauthorized';
import { ThemeConfig } from './config/theme';

function App() {
  return (
    <div style={{ width: "100%" }}>
      <ThemeConfig>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/*" element={<Authorized />} />
            <Route path="/*" element={<Unauthorized />} />
          </Routes>
        </BrowserRouter>
      </ThemeConfig>
    </div>
  );
}

export default App
