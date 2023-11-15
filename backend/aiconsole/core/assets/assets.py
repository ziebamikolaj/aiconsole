# The AIConsole Project
#
# Copyright 2023 10Clouds
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import logging
from typing import Dict, List, Optional
from aiconsole.core.assets.asset import Asset, AssetLocation, AssetStatus, AssetType
from aiconsole.core.assets.fs.delete_asset_from_fs import delete_asset_from_fs
from aiconsole.core.assets.fs.move_asset_in_fs import move_asset_in_fs
from aiconsole.core.assets.fs.save_asset_to_fs import save_asset_to_fs
from aiconsole.core.assets.load_all_assets import load_all_assets

import watchdog.events
import watchdog.observers
from aiconsole.core.project.paths import get_project_assets_directory
from aiconsole.core.settings.project_settings import get_aiconsole_settings
from aiconsole.utils.BatchingWatchDogHandler import BatchingWatchDogHandler
from aiconsole.api.websockets.outgoing_messages import AssetsUpdatedWSMessage

_log = logging.getLogger(__name__)


class Assets:
    # _assets have lists, where the first element is the one overriding the others (currently there can be only one overriden element)
    _assets: Dict[str, list[Asset]]

    def __init__(self, asset_type: AssetType):
        self._suppress_notification_until = None
        self.asset_type = asset_type
        self._assets = {}

        self.observer = watchdog.observers.Observer()

        get_project_assets_directory(asset_type).mkdir(parents=True, exist_ok=True)
        self.observer.schedule(
            BatchingWatchDogHandler(self.reload), get_project_assets_directory(asset_type), recursive=True
        )
        self.observer.start()

    def stop(self):
        self.observer.stop()

    def all_assets(self) -> List[Asset]:
        """
        Return all loaded assets.
        """
        return list(assets[0] for assets in self._assets.values())

    def assets_with_status(self, status: AssetStatus) -> List[Asset]:
        """
        Return all loaded assets with a specific status.
        """
        settings = get_aiconsole_settings()
        return [
            assets[0]
            for assets in self._assets.values()
            if settings.get_asset_status(self.asset_type, assets[0].id) in [status]
        ]

    async def save_asset(self, asset: Asset, new: bool, old_asset_id: Optional[str] = None):
        new_asset = await save_asset_to_fs(asset, new, old_asset_id)

        if asset.id in self._assets:
            self._assets[asset.id][0] = new_asset
        else:
            self._assets[asset.id] = [new_asset]

        self._suppress_notification()

    async def delete_asset(self, asset_id):
        delete_asset_from_fs(self.asset_type, asset_id)

        self._assets[asset_id].pop(0)

        if len(self._assets[asset_id]) == 0:
            del self._assets[asset_id]

        self._suppress_notification()

    def move(self, old_asset_id: str, new_asset_id: str) -> None:
        move_asset_in_fs(self.asset_type, old_asset_id, new_asset_id)
        self._suppress_notification()

    def _suppress_notification(self):
        self._suppress_notification_until = datetime.datetime.now() + datetime.timedelta(seconds=10)

    def get_asset(self, name, location: AssetLocation | None = None):
        """
        Get a specific asset.
        """
        if name not in self._assets or len(self._assets[name]) == 0:
            return None

        for asset in self._assets[name]:
            if location == None or asset.defined_in == location:
                return asset

        return None

    async def reload(self, initial: bool = False):
        _log.info(f"Reloading {self.asset_type}s ...")

        self._assets = await load_all_assets(self.asset_type)

        await AssetsUpdatedWSMessage(
            initial=(
                initial
                or not (
                    not self._suppress_notification_until
                    or self._suppress_notification_until < datetime.datetime.now()
                )
            ),
            asset_type=self.asset_type,
            count=len(self._assets),
        ).send_to_all()
