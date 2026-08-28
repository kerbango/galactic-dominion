// Maps a failed upgrade-purchase error to a friendly message.
//
// base44.functions.invoke throws an Axios-style error on a 4xx response,
// whose .message is the raw "Request failed with status code 400" — not the
// server's { error } body. The backend returns status 400 with
// "Not enough resources for this upgrade." when the player can't afford a
// tier; we surface that as "Not Enough Resources". Other server messages
// (e.g. already-maximum, tech not completed) are shown verbatim when
// available. `err` may also be a plain string (the non-throw res.data.error
// path) so both call sites can share this helper.
export function purchaseErrorMessage(err) {
  if (typeof err === 'string') {
    return /not enough/i.test(err) ? 'Not Enough Resources' : err;
  }
  if (err?.response?.status === 400) return 'Not Enough Resources';
  const serverMsg = err?.response?.data?.error || err?.data?.error;
  if (serverMsg && /not enough/i.test(serverMsg)) return 'Not Enough Resources';
  return serverMsg || err?.message || 'Purchase failed.';
}