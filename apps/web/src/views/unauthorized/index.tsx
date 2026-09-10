import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './loginPage';
import RegisterPage from './registerPage';
import { withPublic } from '@/hocs/withPublic';
import { useEffect } from 'react';

function Unauthorized() { 
    const navigate = useNavigate();

    useEffect(() => { 
        navigate('/login');
    },[])

    return(
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
        </Routes>
    )
}

export default withPublic(Unauthorized);
