-- =====================================================
-- Migration 002 — RemovalRequests table
-- Run once in SSMS against the existing Grub DB.
-- Idempotent: safe to re-run.
-- =====================================================

USE Grub;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RemovalRequests')
BEGIN
    CREATE TABLE RemovalRequests (
        RequestID         INT           PRIMARY KEY IDENTITY(1,1),
        RequestedByUserID INT           NOT NULL,
        TargetUserID      INT           NOT NULL,
        Reason            NVARCHAR(500) NOT NULL,
        Status            NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                          CONSTRAINT CK_RemovalRequests_Status
                          CHECK (Status IN ('Pending', 'Approved', 'Denied')),
        CreatedAt         DATETIME      DEFAULT GETDATE(),
        ResolvedByUserID  INT           NULL,
        ResolvedAt        DATETIME      NULL,
        ResolutionNote    NVARCHAR(500) NULL,
        FOREIGN KEY (RequestedByUserID) REFERENCES Users(UserID),
        FOREIGN KEY (TargetUserID)      REFERENCES Users(UserID),
        FOREIGN KEY (ResolvedByUserID)  REFERENCES Users(UserID)
    );

    CREATE INDEX IX_RemovalRequests_Status        ON RemovalRequests (Status);
    CREATE INDEX IX_RemovalRequests_TargetUserID  ON RemovalRequests (TargetUserID);

    PRINT 'Migration 002 applied — RemovalRequests created.';
END
ELSE
    PRINT 'Migration 002 skipped — RemovalRequests already exists.';
GO
