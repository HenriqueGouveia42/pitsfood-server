-- CreateTable
CREATE TABLE "AuthorizedDevice" (
    "authorization_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "AuthorizedDevice_pkey" PRIMARY KEY ("authorization_id")
);

-- AddForeignKey
ALTER TABLE "AuthorizedDevice" ADD CONSTRAINT "AuthorizedDevice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
