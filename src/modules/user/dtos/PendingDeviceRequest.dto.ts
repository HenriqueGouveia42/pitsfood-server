export type PendingDeviceRequestDTO = {
    readonly user_id: string;
    readonly user_name: string;
    readonly device_id: string;
    readonly requested_at: number; // Timestamp para controlar a expiração
}