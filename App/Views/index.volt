<input type="file" accept=".zip, .xml, .img" name="restore-file" style="display: none!important;"/>
{{ link_to("module-backup/create", '<i class="save icon"></i> '~t._('bkp_CreateBackup'), "class": " ui blue button disability") }}
{{ link_to("module-backup/automatic", '<i class="calendar alternate outline icon"></i> '~t._('bkp_CreateBackupAutomatic'), "class": " ui blue button disability") }}
<button class="ui button disability" id="uploadbtn"><i class="cloud upload alternate icon"></i>{{ t._('bkp_RestoreFileName') }}</button>
<div class="ui hidden divider"></div>
<div class="ui indicating progress" id="upload-progress-bar">
    <div class="bar">
        <div class="progress"></div>
    </div>
    <div class="label"></div>
</div>
<div id="existing-backup-files">
    <table class="ui selectable compact table" id="existing-backup-files-table">
        <thead>
        <tr>
            <th></th>
            <th>{{ t._('bkp_CreateDate') }}</th>
            <th>{{ t._('bkp_Filesize') }}</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
        <tr id="dummy-row">
            <td class="center aligned disabled" colspan="4">{{ t._('bkp_NoBackupRecordsAvailable') }}</td>
        </tr>
        <tr id="backup-template-row">
            <td class="status"><i class="spinner loading icon"></i></td>
            <td class="create-date">17.01.2008</td>
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
</div>