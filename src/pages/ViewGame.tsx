import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import ChessboardReplay from '../components/Chessboard/ChessboardReplay';
import { GlobleContext } from '../context/Context';
import { Move } from '../context/types';

export interface GameDetails {
    moves?: Move[];
    roomId: string;
    player1: string;
    player2: string;
    startTime: string;
    endTime?: string | null;
    winner?: string | null;
}

const ViewGame = () => {
    const {
        userState: { accessToken },
    } = useContext(GlobleContext);

    const { roomId } = useParams();
    const [game, setGame] = useState<GameDetails>({
        roomId: '',
        player1: '',
        player2: '',
        startTime: '',
        endTime: null,
        winner: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const response = await fetch(
                    import.meta.env.VITE_BACKEND_API_URL +
                        `api/User/game/${roomId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data: GameDetails = await response.json();
                console.table(data);
                setGame(data);
            } catch (error) {
                console.error('Error fetching game:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
    }, [roomId, accessToken]);

    if (loading) return <p>Loading game...</p>;
    if (!game.roomId) return <p>Game not found</p>;

    return (
        <div>
            <h2>Game Replay: {game.roomId}</h2>
            <p>
                Players: {game.player1} vs {game.player2}
            </p>
            <p>Start: {new Date(game.startTime).toLocaleString()}</p>
            <p>
                End:{' '}
                {game.endTime
                    ? new Date(game.endTime).toLocaleString()
                    : 'In Progress'}
            </p>
            <p>Winner: {game.winner ?? 'No winner yet'}</p>

            <ChessboardReplay moves={game.moves} />
        </div>
    );
};

export default ViewGame;
