import { createBrowserRouter } from 'react-router';
import { Home } from './components/Home';
import { CaptainPanel } from './components/CaptainPanel';
import { ChefPanel } from './components/ChefPanel';
import { ManagerPanel } from './components/ManagerPanel';
import { UserPanel } from './components/UserPanel';
import { TableVerification } from './components/TableVerification';
import { SalesDashboard } from './components/SalesDashboard';

export const router = createBrowserRouter([
  { path: '/', Component: Home },
  { path: '/captain', Component: CaptainPanel },
  { path: '/chef', Component: ChefPanel },
  { path: '/manager', Component: ManagerPanel },
  { path: '/manager/sales', Component: SalesDashboard },
  { path: '/user-access', Component: TableVerification },
  { path: '/user/:tableNumber', Component: UserPanel },
]);
