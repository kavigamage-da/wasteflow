import { query } from '../db/pool';
import { ApiError } from '../http/envelope';
import { signAccessToken, signRefreshToken, verifyPassword, type AuthUser, type RoleCode } from '../middleware/auth';
import type { QueryResultRow } from 'pg';

interface UserRow extends QueryResultRow {
  id: string;
  name: string;
  username: string;
  email: string | null;
  password_hash: string;
  role_code: RoleCode;
  lga_id: string | null;
  lga_name: string | null;
  facility_id: string | null;
  facility_name: string | null;
  active: boolean;
}

const USER_SELECT = `
  SELECT u.id, u.name, u.username, u.email, u.password_hash, u.lga_id, u.facility_id, u.active,
         r.code AS role_code,
         l.name AS lga_name,
         f.name AS facility_name
  FROM users u
  LEFT JOIN roles r ON r.id = u.role_id
  LEFT JOIN lgas l ON l.id = u.lga_id
  LEFT JOIN facilities f ON f.id = u.facility_id
`;

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role_code,
    lgaId: row.lga_id,
    facilityId: row.facility_id
  };
}

function publicUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role_code,
    lgaId: row.lga_id,
    lgaName: row.lga_name,
    facilityId: row.facility_id,
    facilityName: row.facility_name,
    active: row.active
  };
}

export const authService = {
  async login(username: string, password: string) {
    const { rows } = await query<UserRow>(`${USER_SELECT} WHERE lower(u.username) = lower($1) LIMIT 1`, [username]);
    const row = rows[0];
    if (!row || !row.active) throw ApiError.unauthorized('Invalid credentials');

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) throw ApiError.unauthorized('Invalid credentials');

    const user = toAuthUser(row);
    return {
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user),
      user: publicUser(row)
    };
  },

  async me(userId: string) {
    const { rows } = await query<UserRow>(`${USER_SELECT} WHERE u.id = $1 LIMIT 1`, [userId]);
    const row = rows[0];
    if (!row) throw ApiError.notFound('User not found');
    return publicUser(row);
  }
};
