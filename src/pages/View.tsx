import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { GlobleContext } from '../context/Context';
import { GameDetails } from '../context/types';

const ViewGames: React.FC = () => {
    const navigate = useNavigate();
    const [games, setGames] = useState<GameDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const {
        userState: { accessToken },
    } = useContext(GlobleContext);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch(
                    import.meta.env.VITE_BACKEND_API_URL + 'api/User/mygames',
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch games');
                }

                const data: GameDetails[] = await response.json();
                setGames(data);
            } catch (err: unknown) {
                setError(
                    err instanceof Error ? err.message : 'Something went wrong'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [accessToken]);

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return <p className="text-destructive text-center mt-10">{error}</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold mb-6">Your Games</h1>
            {games.length === 0 ? (
                <p className="text-muted-foreground">No games found.</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {games.map((game) => (
                        <Card key={game.roomId} className="shadow-md">
                            <CardHeader>
                                <CardTitle>Room ID: {game.roomId}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm text-muted-foreground">
                                <p>
                                    <strong>Player 1:</strong> {game.player1}
                                </p>
                                <p>
                                    <strong>Player 2:</strong> {game.player2}
                                </p>
                                <p>
                                    <strong>Start:</strong>{' '}
                                    {new Date(game.startTime).toLocaleString()}
                                </p>
                                {game.endTime && (
                                    <p>
                                        <strong>End:</strong>{' '}
                                        {new Date(
                                            game.endTime
                                        ).toLocaleString()}
                                    </p>
                                )}
                                {game.winner && (
                                    <p>
                                        <strong>Winner:</strong> {game.winner}
                                    </p>
                                )}
                                <Button
                                    className="mt-3 w-full"
                                    onClick={() =>
                                        navigate(`/view/${game.roomId}`)
                                    }
                                >
                                    View Game
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewGames;
