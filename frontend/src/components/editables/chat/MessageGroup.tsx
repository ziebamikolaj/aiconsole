// The AIConsole Project
//
// Copyright 2023 10Clouds
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { AICMessageGroup } from '../../../types/editables/chatTypes';
import { cn } from '@/utils/common/cn';
import { UserInfo } from '@/components/editables/chat/UserInfo';
import { MessageComponent } from './messages/MessageComponent';

export function MessageGroup({ group }: { group: AICMessageGroup }) {
  return (
    <div
      className={cn('group flex flex-row shadow-md border-b border-gray-600 py-[30px] bg-gray-900 ', {
        'message-gradient': group.role === 'assistant',
      })}
    >
      <div className="container flex mx-auto gap-[92px] max-w-[1104px]">
        <UserInfo agentId={group.agent_id} materialsIds={group.materials_ids} task={group.task} />
        <div className="flex-grow flex flex-col gap-5  overflow-auto ">
          {group.messages.map((message) => (
            <MessageComponent key={message.id} message={message} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
}
