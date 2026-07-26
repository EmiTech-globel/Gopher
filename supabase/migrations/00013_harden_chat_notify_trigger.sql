create or replace function notify_on_chat_message()
returns trigger as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  begin
    select case
      when errands.requester_id = new.sender_id then errands.scout_id
      else errands.requester_id
    end
    into recipient_id
    from errands where errands.id = new.errand_id;

    if recipient_id is not null then
      select full_name into sender_name from profiles where id = new.sender_id;

      insert into notifications (user_id, type, title, body, errand_id)
      values (
        recipient_id,
        'chat_message',
        coalesce(sender_name, 'Someone') || ' sent a message',
        coalesce(new.message_text, 'Sent a photo'),
        new.errand_id
      );
    end if;
  exception when others then
    -- Notifications are secondary; chat delivery is the critical path
    -- (Section 12). A failure here must never roll back the message.
    raise warning 'notify_on_chat_message failed: %', SQLERRM;
  end;

  return new;
end;
$$ language plpgsql security definer;