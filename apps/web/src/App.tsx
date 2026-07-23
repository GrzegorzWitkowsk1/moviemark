import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Authorized from './views/authorized';
import Unauthorized from './views/unauthorized';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/*" element={<Authorized />} />
        <Route path="/*" element={<Unauthorized />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
