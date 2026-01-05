-- Trigger to sync user role changes to sangjo_dashboard_users if applicable
CREATE OR REPLACE FUNCTION sync_user_role_to_sangjo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role LIKE 'sangjo_%' THEN
    -- Update sangjo_dashboard_users if the user exists there
    UPDATE public.sangjo_dashboard_users
    SET role = CASE 
        WHEN NEW.role = 'sangjo_hq_admin' THEN 'admin'
        ELSE 'staff'
    END
    WHERE id = NEW.clerk_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_role_update ON public.users;
CREATE TRIGGER on_user_role_update
AFTER UPDATE OF role ON public.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_to_sangjo();
