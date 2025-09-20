import { db } from '../utils/database';
import {
  User,
  Wallet,
  Transaction,
  TransactionType,
  TransactionStatus,
  UserPreferences,
  WalletBalance
} from '../types';

/**
 * User model for database operations
 */
export class UserModel {
  /**
   * Create a new user
   */
  static async create(userData: {
    phoneNumber: string;
    whatsappId: string;
    walletAddress?: string;
    preferences?: Partial<UserPreferences>;
  }): Promise<User> {
    const query = `
      INSERT INTO users (
        phone_number, whatsapp_id, wallet_address,
        preferences, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;

    const preferences = {
      defaultCurrency: 'USDC',
      notifications: true,
      language: 'en',
      timezone: 'UTC',
      ...userData.preferences,
    };

    const values = [
      userData.phoneNumber,
      userData.whatsappId,
      userData.walletAddress,
      JSON.stringify(preferences),
    ];

    const result = await db.query(query, values);
    return this.mapDbUserToUser(result.rows[0]);
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbUserToUser(result.rows[0]);
  }

  /**
   * Find user by WhatsApp ID
   */
  static async findByWhatsAppId(whatsappId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE whatsapp_id = $1 AND is_active = true';
    const result = await db.query(query, [whatsappId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbUserToUser(result.rows[0]);
  }

  /**
   * Find user by phone number
   */
  static async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE phone_number = $1 AND is_active = true';
    const result = await db.query(query, [phoneNumber]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbUserToUser(result.rows[0]);
  }

  /**
   * Update user
   */
  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    // First, get the current user to merge preferences properly
    const currentUser = await this.findById(id);
    if (!currentUser) {
      return null;
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.phoneNumber) {
      fields.push(`phone_number = $${paramCount++}`);
      values.push(updates.phoneNumber);
    }

    if (updates.walletAddress !== undefined) {
      fields.push(`wallet_address = $${paramCount++}`);
      values.push(updates.walletAddress);
    }

    if (updates.preferences) {
      // Merge current preferences with updates
      const mergedPreferences = {
        ...currentUser.preferences,
        ...updates.preferences
      };
      fields.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(mergedPreferences));
    }

    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) {
      return currentUser;
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    values.push(id);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbUserToUser(result.rows[0]);
  }

  /**
   * Delete user (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Map database row to User object
   */
  private static mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      phoneNumber: dbUser.phone_number,
      whatsappId: dbUser.whatsapp_id,
      walletAddress: dbUser.wallet_address,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      isActive: dbUser.is_active,
      preferences: typeof dbUser.preferences === 'string'
        ? JSON.parse(dbUser.preferences)
        : dbUser.preferences,
    };
  }
}

/**
 * Wallet model for database operations
 */
export class WalletModel {
  /**
   * Create a new wallet
   */
  static async create(walletData: {
    userId: string;
    address: string;
    network: string;
  }): Promise<Wallet> {
    const query = `
      INSERT INTO wallets (user_id, address, network, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;

    const values = [walletData.userId, walletData.address, walletData.network];
    const result = await db.query(query, values);

    return this.mapDbWalletToWallet(result.rows[0]);
  }

  /**
   * Find wallet by ID
   */
  static async findById(id: string): Promise<Wallet | null> {
    const query = `
      SELECT w.*, wb.currency, wb.amount, wb.last_updated
      FROM wallets w
      LEFT JOIN wallet_balances wb ON w.id = wb.wallet_id
      WHERE w.id = $1 AND w.is_active = true
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbWalletToWallet(result.rows[0]);
  }

  /**
   * Find wallets by user ID
   */
  static async findByUserId(userId: string): Promise<Wallet[]> {
    const query = `
      SELECT w.*, wb.currency, wb.amount, wb.last_updated
      FROM wallets w
      LEFT JOIN wallet_balances wb ON w.id = wb.wallet_id
      WHERE w.user_id = $1 AND w.is_active = true
      ORDER BY w.created_at DESC
    `;
    const result = await db.query(query, [userId]);

    // Group balances by wallet
    const walletsMap = new Map<string, Wallet>();

    for (const row of result.rows) {
      const walletId = row.id;

      if (!walletsMap.has(walletId)) {
        walletsMap.set(walletId, this.mapDbWalletToWallet(row));
      }

      if (row.currency) {
        const wallet = walletsMap.get(walletId)!;
        wallet.balances.push({
          currency: row.currency,
          amount: row.amount,
          lastUpdated: new Date(row.last_updated),
        });
      }
    }

    return Array.from(walletsMap.values());
  }

  /**
   * Update wallet balance
   */
  static async updateBalance(
    walletId: string,
    currency: string,
    amount: string
  ): Promise<void> {
    const query = `
      INSERT INTO wallet_balances (wallet_id, currency, amount, last_updated)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (wallet_id, currency)
      DO UPDATE SET amount = $3, last_updated = NOW()
    `;

    await db.query(query, [walletId, currency, amount]);
  }

  /**
   * Map database row to Wallet object
   */
  private static mapDbWalletToWallet(dbWallet: any): Wallet {
    return {
      id: dbWallet.id,
      userId: dbWallet.user_id,
      address: dbWallet.address,
      network: dbWallet.network,
      isActive: dbWallet.is_active,
      createdAt: new Date(dbWallet.created_at),
      balances: [],
    };
  }
}

/**
 * Transaction model for database operations
 */
export class TransactionModel {
  /**
   * Create a new transaction
   */
  static async create(transactionData: {
    userId: string;
    type: TransactionType;
    amount: string;
    currency: string;
    fromAddress?: string;
    toAddress?: string;
    network: string;
    txHash?: string;
    gasUsed?: string;
    gasPrice?: string;
    fee?: string;
    metadata?: Record<string, any>;
  }): Promise<Transaction> {
    const query = `
      INSERT INTO transactions (
        user_id, type, status, amount, currency,
        from_address, to_address, network, tx_hash,
        gas_used, gas_price, fee, metadata,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      transactionData.userId,
      transactionData.type,
      'pending',
      transactionData.amount,
      transactionData.currency,
      transactionData.fromAddress,
      transactionData.toAddress,
      transactionData.network,
      transactionData.txHash,
      transactionData.gasUsed,
      transactionData.gasPrice,
      transactionData.fee,
      JSON.stringify(transactionData.metadata || {}),
    ];

    const result = await db.query(query, values);
    return this.mapDbTransactionToTransaction(result.rows[0]);
  }

  /**
   * Find transaction by ID
   */
  static async findById(id: string): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbTransactionToTransaction(result.rows[0]);
  }

  /**
   * Find transactions by user ID
   */
  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows.map(this.mapDbTransactionToTransaction);
  }

  /**
   * Update transaction status
   */
  static async updateStatus(
    id: string,
    status: TransactionStatus,
    txHash?: string,
    completedAt?: Date
  ): Promise<Transaction | null> {
    const fields: string[] = ['status = $1', 'updated_at = NOW()'];
    const values: any[] = [status];
    let paramCount = 2;

    if (txHash) {
      fields.push(`tx_hash = $${paramCount++}`);
      values.push(txHash);
    }

    if (completedAt) {
      fields.push(`completed_at = $${paramCount++}`);
      values.push(completedAt);
    }

    const query = `
      UPDATE transactions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    values.push(id);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbTransactionToTransaction(result.rows[0]);
  }

  /**
   * Get transaction statistics for a user
   */
  static async getUserStats(userId: string): Promise<{
    totalTransactions: number;
    totalVolume: string;
    successfulTransactions: number;
    pendingTransactions: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0) as total_volume,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions
      FROM transactions
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    const stats = result.rows[0];

    return {
      totalTransactions: parseInt(stats.total_transactions),
      totalVolume: stats.total_volume,
      successfulTransactions: parseInt(stats.successful_transactions),
      pendingTransactions: parseInt(stats.pending_transactions),
    };
  }

  /**
   * Map database row to Transaction object
   */
  private static mapDbTransactionToTransaction(dbTransaction: any): Transaction {
    return {
      id: dbTransaction.id,
      userId: dbTransaction.user_id,
      type: dbTransaction.type,
      status: dbTransaction.status,
      amount: dbTransaction.amount,
      currency: dbTransaction.currency,
      fromAddress: dbTransaction.from_address,
      toAddress: dbTransaction.to_address,
      network: dbTransaction.network,
      txHash: dbTransaction.tx_hash,
      gasUsed: dbTransaction.gas_used,
      gasPrice: dbTransaction.gas_price,
      fee: dbTransaction.fee,
      metadata: typeof dbTransaction.metadata === 'string'
        ? JSON.parse(dbTransaction.metadata)
        : dbTransaction.metadata,
      createdAt: new Date(dbTransaction.created_at),
      updatedAt: new Date(dbTransaction.updated_at),
      completedAt: dbTransaction.completed_at ? new Date(dbTransaction.completed_at) : undefined,
    };
  }
}