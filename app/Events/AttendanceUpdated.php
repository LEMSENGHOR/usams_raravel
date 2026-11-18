<?php

namespace App\Events;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sessionId,
        public string $action,
        public array $data = [],
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('attendance.session.' . $this->sessionId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'attendance.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'action' => $this->action,
            'data' => $this->data,
        ];
    }
}
