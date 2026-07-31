import { Routes, Route } from 'react-router-dom';
import LoginPage from './loginPage';
import RegisterPage from './registerPage';

export default function Unauthorized() { 
    return(
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
        </Routes>
    )
}
