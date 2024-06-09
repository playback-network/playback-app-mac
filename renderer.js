
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-supabase-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.interimResults = true;
recognition.onresult = async (event) => {
  const transcript = Array.from(event.results)
    .map(result => result[0])
    .map(result => result.transcript)
    .join('');

  document.getElementById('text-box').value = transcript;

  if (event.results[0].isFinal) {
    await saveTranscript(transcript);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  document.body.style.cursor = 'auto';

  window.electron.onCommandMode((event, commandMode) => {
    if (commandMode) {
      document.body.style.cursor = 'pointer';
      recognition.start();
    } else {
      document.body.style.cursor = 'auto';
      recognition.stop();
    }
  });
});

async function saveTranscript(transcript) {
  const { data, error } = await supabase
    .from('transcripts')
    .insert([{ text: transcript }]);

  if (error) {
    console.error('Error saving transcript:', error);
  } else {
    console.log('Transcript saved:', data);
  }
}
