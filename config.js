
var serverName = 'earwicker';

module.exports = {
    
    port: 81,

    targetMachine: serverName + '.cloudapp.net',

    loggingDir: 'C:\\Users\\danielearwicker\\AppData\\Local\\PRISYMSetupLogs',

    jenkins: {
        builds: {
            trunk: 'http://10.0.0.36:8080/job/NextGenTrunkBuild/lastSuccessfulBuild/artifact/ProductInstallation/InstallerOutput/',
            artwork: 'http://prototypebuilds:8080/job/ArtworkPrototypeBuild/lastSuccessfulBuild/artifact/ProductInstallation/InstallerOutput/'
        },
        defaultBuild: 'trunk',
        auth: {
            username: 'danielearwicker',
            password: 'password',
            sendImmediately: true
        }
    },
    
    uninstall: {
        program: '"C:\\Program Files\\PRISYM 360\\InstallationState\\setup.exe"',
        arguments: ['/uninstall', 'AllPagesNext=1']
    },
    
    databases: [{
        user: 'sa',
        password: 'Help8585',
        server: serverName,
        database: 'P360MAIN'
    },{
        user: 'sa',
        password: 'Help8585',
        server: serverName,
        database: 'P360AUDIT'
    }],
    
    startOfLog: 'Installing',
    endOfLog: 'Leaving Main'
};

