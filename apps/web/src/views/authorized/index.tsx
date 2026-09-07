import { Routes, Route } from 'react-router-dom';
import HomePage from './homePage';
import SearchPage from './searchPage';
import SettingsPage from './settingsPage';
import CollectionPage from './collectionPage';
import DetailsPage from './detailsPage';
import { withAuth } from '@/hocs/withAuth';
import AppLayout from '@/components/layout/AppLayout';


function Authorized() { 
    return(
        <AppLayout>
        <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/collections" element={<CollectionPage />} />
            <Route path="/movies" element={<DetailsPage />} />
        </Routes>
        </AppLayout>
    )
}

export default withAuth(Authorized);