import {
    AccountMeta,
    AccountNonSignerMeta,
    ReadonlyAccount,
    ReadonlySignerAccount,
    WritableAccount,
    WritableSignerAccount,
} from '../accounts';

// [DESCRIBE] AccountNonSignerMeta
{
    // It is satisfied by readonly and writable account metas.
    {
        const readonlyAccount = null as unknown as ReadonlyAccount<'1111'>;
        readonlyAccount satisfies AccountNonSignerMeta;
        readonlyAccount satisfies AccountNonSignerMeta<'1111'>;

        const writableAccount = null as unknown as WritableAccount<'1111'>;
        writableAccount satisfies AccountNonSignerMeta;
        writableAccount satisfies AccountNonSignerMeta<'1111'>;
    }

    // It satisfies AccountMeta.
    {
        const meta = null as unknown as AccountNonSignerMeta<'1111'>;
        meta satisfies AccountMeta<'1111'>;
    }

    // It is not satisfied by account metas with signer roles.
    {
        const readonlySignerAccount = null as unknown as ReadonlySignerAccount<'1111'>;
        // @ts-expect-error Signer roles are not allowed in non-signer account metas.
        readonlySignerAccount satisfies AccountNonSignerMeta<'1111'>;

        const writableSignerAccount = null as unknown as WritableSignerAccount<'1111'>;
        // @ts-expect-error Signer roles are not allowed in non-signer account metas.
        writableSignerAccount satisfies AccountNonSignerMeta<'1111'>;
    }

    // It is not satisfied by account metas with an unknown role.
    {
        const meta = null as unknown as AccountMeta<'1111'>;
        // @ts-expect-error The role could be a signer role.
        meta satisfies AccountNonSignerMeta<'1111'>;
    }

    // It tracks the address type parameter.
    {
        const meta = null as unknown as AccountNonSignerMeta<'1111'>;
        // @ts-expect-error The address is not of the expected type.
        meta satisfies AccountNonSignerMeta<'2222'>;
    }
}
