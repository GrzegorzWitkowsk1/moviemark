import { Routes, Route } from 'react-router-dom';
import HomePage from './homePage';
import SearchPage from './searchPage';
import SettingsPage from './settingsPage';
import CollectionPage from './collectionPage';
import { withAuth } from '@/hocs/withAuth';


function Authorized() { 
    return(
        <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/collections" element={<CollectionPage />} />
        </Routes>
    )
}

export default withAuth(Authorized);