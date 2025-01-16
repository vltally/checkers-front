import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameRooms.css';

interface GameRoom {
    id: string;
    player1Id: string;
}

const GameRooms = () => {
    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const playerId = crypto.randomUUID();

    const fetchGames = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5115/api/games');
            if (!response.ok) {
                throw new Error('Failed to fetch games');
            }
            const data = await response.json();
            setRooms(data);
        } catch (err) {
            setError('Failed to load games. Please try again.');
            console.error('Error fetching games:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, []);

    const createRoom = async () => {
        try {
            const response = await fetch('http://localhost:5115/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerId),
            });

            if (!response.ok) {
                throw new Error('Failed to create game');
            }

            const game = await response.json();
            navigate(`/game/${game.id}`);
        } catch (err) {
            setError('Failed to create game. Please try again.');
            console.error('Error creating game:', err);
        }
    };

    const joinRoom = async (gameId: string) => {
        navigate(`/game/${gameId}`);
    };

    return (
        <div className="rooms-container">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Available Game Rooms</h2>
                    <button 
                        className="button button-secondary"
                        onClick={fetchGames}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                
                <div className="card-content">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
                    <button
                        className="button button-primary create-room-button"
                        onClick={createRoom}
                        disabled={isLoading}
                    >
                        Create New Room
                    </button>

                    {isLoading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Loading games...</p>
                        </div>
                    ) : rooms.length > 0 ? (
                        <div className="rooms-grid">
                            {rooms.map((room) => (
                                <div key={room.id} className="room-card">
                                    <span>
                                        Room ID: {room.id.slice(0, 8)}...
                                    </span>
                                    <button
                                        className="button button-primary"
                                        onClick={() => joinRoom(room.id)}
                                    >
                                        Join Game
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#666' }}>
                            No available rooms. Create one!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameRooms;