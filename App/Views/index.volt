<input type="file" accept=".zip, .xml, .img" name="restore-file" style="display: none!important;"/>

<div class="ui stackable grid backup-actions-grid">
    <div class="row">
        <div class="column">
            <div class="ui basic segment backup-action-buttons">
                {{ link_to("module-backup/create", '<i class="hdd outline icon"></i> '~t._('bkp_CreateBackup'), "class": "ui labeled icon teal button disability") }}
                {{ link_to("module-backup/automatic", '<i class="calendar alternate outline icon"></i> '~t._('bkp_CreateBackupAutomatic'), "class": "ui labeled icon button disability") }}
                <button class="ui labeled icon button disability" id="uploadbtn">
                    <i class="cloud upload alternate icon"></i>{{ t._('bkp_RestoreFileName') }}
                </button>
            </div>
        </div>
    </div>
</div>

<div class="ui indicating progress backup-upload-progress" id="upload-progress-bar">
    <div class="bar">
        <div class="progress"></div>
    </div>
    <div class="label"></div>
</div>

<div id="existing-backup-files" class="backup-files-container">
    <table class="ui selectable compact celled striped table" id="existing-backup-files-table">
        <thead>
        <tr>
            <th class="one wide center aligned"></th>
            <th>{{ t._('bkp_CreateDate') }}</th>
            <th>{{ t._('bkp_Filesize') }}</th>
            <th class="three wide right aligned"></th>
        </tr>
        </thead>
        <tbody>
        <tr id="dummy-row">
            <td class="center aligned disabled"></td>
            <td class="center aligned disabled">{{ t._('bkp_NoBackupRecordsAvailable') }}</td>
            <td class="center aligned disabled"></td>
            <td class="center aligned disabled"></td>
        </tr>
        </tbody>
    </table>
</div>

{# Template row outside the table - DataTables won't touch it #}
<table style="display:none;">
<tbody>
<tr id="backup-template-row">
    <td class="status center aligned"><i class="spinner loading icon"></i></td>
    <td class="create-date" data-sort="1479686400" data-order="1479686400"></td>
    <td class="file-size">127 MB</td>
    {{ partial("partials/tablesbuttons",
        [
            'id': '',
            'restore' : 'module-backup/restore/',
            'download' : 'module-backup/download/',
            'delete': 'module-backup/delete/'
        ]) }}
</tr>
</tbody>
</table>
