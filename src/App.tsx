import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css'
import Chessboard from './components/Chessboard/Chessboard'
import GameRooms from './components/room';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<GameRooms />} />
            <Route path="/game/:gameId" element={<Chessboard />} />
        </Routes>
    </Router>
);
}

export default App
