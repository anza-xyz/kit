/**
 * Describes the purpose for which an account participates in a transaction.
 *
 * Every account that participates in a transaction can be read from, but only ones that you mark as
 * writable may be written to, and only ones that you indicate must sign the transaction will gain
 * the privileges associated with signers at runtime.
 *
 * |                               | `isSigner` | `isWritable` |
 * | ----------------------------- | ---------- | ------------ |
 * | `AccountRole.READONLY`        | &#x274c;   | &#x274c;     |
 * | `AccountRole.WRITABLE`        | &#x274c;   | &#x2705;     |
 * | `AccountRole.READONLY_SIGNER` | &#x2705;   | &#x274c;     |
 * | `AccountRole.WRITABLE_SIGNER` | &#x2705;   | &#x2705;     |
 */
export enum AccountRole {
    // Bitflag guide: is signer ⌄⌄ is writable
    WRITABLE_SIGNER = /* 3 */ 0b11, // prettier-ignore
    READONLY_SIGNER = /* 2 */ 0b10, // prettier-ignore
    WRITABLE =        /* 1 */ 0b01, // prettier-ignore
    READONLY =        /* 0 */ 0b00, // prettier-ignore
}

// Quick primer on bitwise operations: https://stackoverflow.com/a/1436448/802047
const IS_SIGNER_BITMASK = 0b10;
const IS_WRITABLE_BITMASK = 0b01;

/**
 * @returns An {@link AccountRole} representing the non-signer variant of the supplied role.
 */
export function downgradeRoleToNonSigner(role: AccountRole.READONLY_SIGNER): AccountRole.READONLY;
export function downgradeRoleToNonSigner(role: AccountRole.WRITABLE_SIGNER): AccountRole.WRITABLE;
export function downgradeRoleToNonSigner(role: AccountRole): AccountRole;
export function downgradeRoleToNonSigner(role: AccountRole): AccountRole {
    return role & ~IS_SIGNER_BITMASK;
}

/**
 * @returns An {@link AccountRole} representing the read-only variant of the supplied role.
 */
export function downgradeRoleToReadonly(role: AccountRole.WRITABLE): AccountRole.READONLY;
export function downgradeRoleToReadonly(role: AccountRole.WRITABLE_SIGNER): AccountRole.READONLY_SIGNER;
export function downgradeRoleToReadonly(role: AccountRole): AccountRole;
export function downgradeRoleToReadonly(role: AccountRole): AccountRole {
    return role & ~IS_WRITABLE_BITMASK;
}

/**
 * Returns `true` if the {@link AccountRole} given represents that of a signer. Also refines the
 * TypeScript type of the supplied role.
 */
export function isSignerRole(role: AccountRole): role is AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER {
    return role >= AccountRole.READONLY_SIGNER;
}

/**
 * Returns `true` if the {@link AccountRole} given represents that of a writable account. Also
 * refines the TypeScript type of the supplied role.
 */
export function isWritableRole(role: AccountRole): role is AccountRole.WRITABLE | AccountRole.WRITABLE_SIGNER {
    return (role & IS_WRITABLE_BITMASK) !== 0;
}

/**
 * Given two {@link AccountRole | AccountRoles}, will return the {@link AccountRole} that grants the
 * highest privileges of both.
 *
 * @example
 * ```ts
 * // Returns `AccountRole.WRITABLE_SIGNER`
 * mergeRoles(AccountRole.READONLY_SIGNER, AccountRole.WRITABLE);
 * ```
 */
export function mergeRoles(roleA: AccountRole.WRITABLE, roleB: AccountRole.READONLY_SIGNER): AccountRole.WRITABLE_SIGNER; // prettier-ignore
export function mergeRoles(roleA: AccountRole.READONLY_SIGNER, roleB: AccountRole.WRITABLE): AccountRole.WRITABLE_SIGNER; // prettier-ignore
export function mergeRoles(roleA: AccountRole, roleB: AccountRole.WRITABLE_SIGNER): AccountRole.WRITABLE_SIGNER; // prettier-ignore
export function mergeRoles(roleA: AccountRole.WRITABLE_SIGNER, roleB: AccountRole): AccountRole.WRITABLE_SIGNER; // prettier-ignore
export function mergeRoles(roleA: AccountRole, roleB: AccountRole.READONLY_SIGNER): AccountRole.READONLY_SIGNER; // prettier-ignore
export function mergeRoles(roleA: AccountRole.READONLY_SIGNER, roleB: AccountRole): AccountRole.READONLY_SIGNER; // prettier-ignore
export function mergeRoles(roleA: AccountRole, roleB: AccountRole.WRITABLE): AccountRole.WRITABLE; // prettier-ignore
export function mergeRoles(roleA: AccountRole.WRITABLE, roleB: AccountRole): AccountRole.WRITABLE; // prettier-ignore
export function mergeRoles(roleA: AccountRole.READONLY, roleB: AccountRole.READONLY): AccountRole.READONLY; // prettier-ignore
export function mergeRoles(roleA: AccountRole, roleB: AccountRole): AccountRole; // prettier-ignore
export function mergeRoles(roleA: AccountRole, roleB: AccountRole): AccountRole {
    return roleA | roleB;
}

/**
 * @returns An {@link AccountRole} representing the signer variant of the supplied role.
 */
export function upgradeRoleToSigner(role: AccountRole.READONLY): AccountRole.READONLY_SIGNER;
export function upgradeRoleToSigner(role: AccountRole.WRITABLE): AccountRole.WRITABLE_SIGNER;
export function upgradeRoleToSigner(role: AccountRole): AccountRole;
export function upgradeRoleToSigner(role: AccountRole): AccountRole {
    return role | IS_SIGNER_BITMASK;
}

/**
 * @returns An {@link AccountRole} representing the writable variant of the supplied role.
 */
export function upgradeRoleToWritable(role: AccountRole.READONLY): AccountRole.WRITABLE;
export function upgradeRoleToWritable(role: AccountRole.READONLY_SIGNER): AccountRole.WRITABLE_SIGNER;
export function upgradeRoleToWritable(role: AccountRole): AccountRole;
export function upgradeRoleToWritable(role: AccountRole): AccountRole {
    return role | IS_WRITABLE_BITMASK;
}
