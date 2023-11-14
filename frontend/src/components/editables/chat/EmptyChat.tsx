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

import { cn } from '@/utils/common/cn';
import { getBaseURL } from '@/store/useAPIStore';
import { Agent, Asset, AssetType } from '@/types/editables/assetTypes';
import { getEditableObjectColor } from '@/utils/editables/getEditableObjectColor';
import { getEditableObjectIcon } from '@/utils/editables/getEditableObjectIcon';
import { useEditableObjectContextMenu } from '@/utils/editables/useContextMenuForEditable';
import { useProjectContextMenu } from '@/utils/projects/useProjectContextMenu';
import { useProjectStore } from '@/store/projects/useProjectStore';
import { Tooltip } from '@mantine/core';
import React from 'react';
import { useEditablesStore } from '@/store/editables/useEditablesStore';

function EmptyChatAgentAvatar({ agent }: { agent: Agent }) {
  const { showContextMenu } = useEditableObjectContextMenu({ editableObjectType: 'agent', editable: agent });

  return (
    <Tooltip label={agent.name} position="bottom" transitionProps={{ transition: 'slide-down', duration: 100 }} withArrow >
      <div key={agent.id} className="flex flex-col items-center justify-center">
        <div
          onClick={showContextMenu()}
          className="inline-block hover:text-secondary cursor-pointer"
          onContextMenu={showContextMenu()}
        >
          <img
            src={`${getBaseURL()}/profile/${agent.id}.jpg`}
            className={cn("filter opacity-75 shadows-lg w-20 h-20 mx-auto rounded-full", agent.status === 'forced' && " border-2 border-primary")}
            alt={agent.name}
          />
        </div>
      </div>
    </Tooltip>
  );
}

function EmptyChatAssetLink({ assetType, asset }: { assetType: AssetType; asset: Asset }) {
  const { showContextMenu } = useEditableObjectContextMenu({ editableObjectType: assetType, editable: asset });

  const Icon = getEditableObjectIcon(asset);
  const color = getEditableObjectColor(asset);

  return (
    <div className="inline-block cursor-pointer" onClick={showContextMenu()} onContextMenu={showContextMenu()}>
      <div className="hover:text-secondary flex flex-row items-center gap-1 opacity-80 hover:opacity-100">
        <Icon style={{ color }} className="w-4 h-4 inline-block mr-1" />
        {asset.name}
      </div>
    </div>
  );
}

export const EmptyChat = () => {
  const projectName = useProjectStore((state) => state.projectName);
  const agents = useEditablesStore((state) => state.agents);
  const materials = useEditablesStore((state) => state.materials || []);
  const { showContextMenu: showProjectContextMenu } = useProjectContextMenu();

  const forcedMaterials = materials.filter((m) => m.status === 'forced');

  return (
    <section className="flex flex-col items-center justify-center container mx-auto px-6 py-8">
      <h2 className="text-4xl mb-8 text-center font-extrabold mt-20 cursor-pointer" onContextMenu={showProjectContextMenu()} onClick={showProjectContextMenu()}>
        <p className="p-2">Project</p>
        <span className=" text-primary uppercase">{projectName}</span>
      </h2>
      <div className="font-bold mb-4 text-center opacity-50 text-sm uppercase">Agents</div>
      <div className="flex flex-row gap-2 mb-8">
        {agents
          .filter((a) => a.id !== 'user' && a.status !== 'disabled')
          .map((agent) => (
            <EmptyChatAgentAvatar key={agent.id} agent={agent} />
          ))}
      </div>
      { forcedMaterials.length > 0 && <>
        <div className="font-bold mb-4 text-center opacity-50 text-sm uppercase">Always in Use</div>
        <div className="text-center">
          {forcedMaterials
            .map((material, index, arr) => (
              <React.Fragment key={material.id}>
                <EmptyChatAssetLink assetType="material" asset={material} />
                {index < arr.length - 1 && <span className="opacity-50">, </span>}
              </React.Fragment>
            ))}
        </div>
      </> }
    </section>
  );
};
