/*
Copyright 2016 OpenMarket Ltd

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

var React = require("react");
var MatrixClientPeg = require('../../../MatrixClientPeg');

module.exports = React.createClass({
    displayName: 'CreateRoomDialog',

    propTypes: {
        onFinished: React.PropTypes.func.isRequired,
    },

    getInitialState: function(props) {
        return {
            encrypt: MatrixClientPeg.get().isCryptoEnabled(),
        };
    },

    onCreateClicked: function() {
        var opts = {
            encrypt: this.state.encrypt,
        };
        this.props.onFinished(true, opts);
    },

    onCancelClicked: function() {
        this.props.onFinished(false);
    },

    _onCryptoToggle: function(ev) {
        switch (ev.target.value) {
            case "crypto_enabled":
                this.setState({encrypt: true});
                break;
            case "crypto_disabled":
                this.setState({encrypt: false});
                break;
        }
    },

    render: function() {
        var crypto = null;

        if (MatrixClientPeg.get().isCryptoEnabled()) {
            crypto = (
                <div className="mx_Dialog_content">
                    Encryption
                    <label>
                        <input type="radio" name="crypto" value="crypto_enabled"
                            onChange={this._onCryptoToggle}
                            checked={this.state.encrypt}/>
                        Enabled
                    </label>
                    <label>
                        <input type="radio" name="crypto" value="crypto_disabled"
                            onChange={this._onCryptoToggle}
                            checked={!this.state.encrypt}/>
                        Disabled
                    </label>
                </div>
            );
        }

        return (
            <div className="mx_CreateRoomDialog">
                <div className="mx_Dialog_title">
                    Create Room
                </div>
                {crypto}
                <div className="mx_Dialog_buttons">
                    <button onClick={this.onCreateClicked} autoFocus={true}>
                        Create
                    </button>
                    <button onClick={this.onCancelClicked}>
                        Cancel
                    </button>
                </div>
            </div>
        );
    },
});
