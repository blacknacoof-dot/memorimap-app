BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
        RETURN NEW;
    END IF;

    IF current_setting('role', true) = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Role changes are not allowed. Contact an administrator.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TRIGGER trigger_prevent_role_escalation ON profiles IS
'Blocks self role escalation for regular users, while allowing service_role and authenticated super_admin operations.';

COMMIT;
