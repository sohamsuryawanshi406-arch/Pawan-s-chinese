import { createBrowserRouter } from 'react-router';
import { Home } from './components/Home';
import { UserPanel } from './components/user/UserPanel';
import { ChefPanel } from './components/ChefPanel';
import { ManagerPanel } from './components/ManagerPanel';
import { SalesDashboard } from './components/SalesDashboard';

export const router = createBrowserRouter([
  { path: '/',                  Component: Home },
  { path: '/user',              Component: UserPanel },
  { path: '/user/:tableNumber', Component: UserPanel },
  { path: '/chef',              Component: ChefPanel },
  { path: '/manager',           Component: ManagerPanel },
  { path: '/manager/sales',     Component: SalesDashboard },
]);
