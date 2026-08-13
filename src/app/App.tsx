import { RouterProvider } from 'react-router';
import { router } from './routes';
import { RestaurantProvider } from './context/RestaurantContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <RestaurantProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </RestaurantProvider>
  );
}