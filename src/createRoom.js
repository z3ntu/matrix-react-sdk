/*
Copyright 2015, 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var MatrixClientPeg = require('./MatrixClientPeg');
var Modal = require('./Modal');
var sdk = require('./index');
var dis = require("./dispatcher");
var UserSettingsStore = require('./UserSettingsStore');

var q = require('q');

/**
 * Create a new room, and switch to it.
 *
 * Returns a promise which resolves to the room id, or null if the
 * action was aborted or failed.
 *
 * @param {object=} opts parameters for creating the room
 * @param {object=} opts.createOpts set of options to pass to createRoom call.
 */
function createRoom(opts) {
    var opts = opts || {};

    var ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    var NeedToRegisterDialog = sdk.getComponent("dialogs.NeedToRegisterDialog");
    var Loader = sdk.getComponent("elements.Spinner");


    var client = MatrixClientPeg.get();
    if (client.isGuest()) {
        Modal.createDialog(NeedToRegisterDialog, {
            title: "Please Register",
            description: "Guest users can't create new rooms. Please register to create room and start a chat."
        });
        return q(null);
    }


    // set some defaults for the creation
    var createOpts = opts.createOpts || {};
    createOpts.preset = createOpts.preset || 'private_chat';
    createOpts.visibility = createOpts.visibility || 'private';
    createOpts.creation_content = createOpts.creation_content || {};

    // Allow guests by default since the room is private and they'd
    // need an invite. This means clicking on a 3pid invite email can
    // actually drop you right in to a chat.
    createOpts.initial_state = createOpts.initial_state || [
        {
            content: {
                guest_access: 'can_join'
            },
            type: 'm.room.guest_access',
            state_key: '',
        }
    ];

    return doCreateRoomDialog().then(function(dialogOpts) {
        if (!dialogOpts) {
            // cancelled
            return null;
        }

        if (dialogOpts.encrypt) {
            createOpts.initial_state.push({
                content: {
                    algorithm: "m.olm.v1.curve25519-aes-sha2",
                },
                type: 'm.room.encryption',
                state_key: '',
            });
        }

        var modal = Modal.createDialog(Loader);

        return client.createRoom(createOpts).finally(function() {
            modal.close();
        }).then(function(res) {
            dis.dispatch({
                action: 'view_room',
                room_id: res.room_id
            });
            return res.room_id;
        }, function(err) {
            Modal.createDialog(ErrorDialog, {
                title: "Failure to create room",
                description: err.toString()
            });
            return null;
        });
    });
}

/**
 * Open the modal 'create room' dialog
 *
 * The result object includes:
 *  - encrypt: true if encryption is enabled
 *
 * @return {Promise} which resolves when the dialog closes. Resolves to null if
 *    the dialog is cancelled, else an object describing the options chosen.
 */
function doCreateRoomDialog() {
    // for now, we'll only show the CreateRoomDialog if e2e is enabled.
    if (!UserSettingsStore.isFeatureEnabled("e2e_encryption")) {
        return q({});
    }

    var CreateRoomDialog = sdk.getComponent("dialogs.CreateRoomDialog");

    var deferred = q.defer();
    Modal.createDialog(CreateRoomDialog, {
        onFinished: function(create, opts) {
            deferred.resolve(create ? opts : null);
        },
    });
    return deferred.promise;
}

module.exports = createRoom;
