import { createBrowserRouter } from 'react-router-dom'
import TitlePage from '../pages/TitlePage'
import BattlePage from '../pages/BattlePage'
import ResultPage from '../pages/ResultPage'

export const router = createBrowserRouter([
  { path: '/',       element: <TitlePage /> },
  { path: '/battle', element: <BattlePage /> },
  { path: '/result', element: <ResultPage /> },
])
