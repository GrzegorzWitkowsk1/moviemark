import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './loginPage';
import RegisterPage from './registerPage';
import { withPublic } from '@/hocs/withPublic';

function Unauthorized() { 
    return(
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

export default withPublic(Unauthorized);