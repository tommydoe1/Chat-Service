import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { HowToUse } from './pages/how-to-use/how-to-use';
import { SuggestedPrompts } from './pages/suggested-prompts/suggested-prompts';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'chat/:id', component: ChatComponent },
  { path: 'how-to-use', component: HowToUse },
  { path: 'suggested-prompts', component: SuggestedPrompts },
  { path: '**', redirectTo: '' }
];