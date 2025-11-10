@Library(['shared-library', 'pipeline-library']) _
def vault = new Vault()

// Cek panduan di wiki berikut: https://gitlab.playcourt.id/devops/devsecops-wiki
PipelineDockerEntryV3([
    // Nama project anda sesuai yang terdaftar di Playcourt. Nama sudah ditentukan di awal, mohon tidak di ubah tanpa komunikasi dengan tim Playcourt.
    projectName: 'legion-ui',

    // Nama dari service yang anda buat dan akan digunakan sebagai nama image docker.
    imageName: 'legion-ui-legionai',

    // Nama cluster di mana service akan dideploy. Deployment sudah ditentukan di awal, mohon tidak di ubah tanpa komunikasi dengan tim Playcourt.
    deployment: 'abcv2',

    // Label dari agent yang akan digunakan untuk menjalankan pipeline, mohon tidak di ubah tanpa komunikasi dengan tim Playcourt.
    agentLabel: 'Docker',

    // Prerun Script
    // Pada bagian ini anda dapat menambahkan dan mengkonfigurasikan script untuk dijalankan sebelum melakukan test atau build service yang anda buat
    prerunScript: {
        // "prerunScript" berisi groovy script yang akan dijalankan sebelum step test dan build
        // Pada bagian ini anda juga dapat membuat variable dan menggunakannya pada script yang lain

        // contoh script untuk mengambil secret dari Vault dan menyimpannya ke dalam file .env:
        // useDotenv = vault.createDotenv("ins/instest/${env.BRANCH_NAME}/example")
    },

    // Service Test
    // Pada bagian ini anda dapat menambahkan dan mengkonfigurasikan script untuk menjalankan test pada service yang anda buat
    testAgentImage: 'playcourt/jenkins:nodejs20', // Untuk option ini, hanya gunakan image dari https://hub.docker.com/r/playcourt/jenkins
    runTestScript: {
        // "runTestScript" berisi groovy script untuk menjalankan test
        // contoh script untuk menjalankan test pada service nodejs
        // sh "npm ci"
        // sh "npm run test"
    },

    // Build Docker Image
    // Pada bagian ini anda dapat mengkonfigurasikan script untuk membuat image dari service yang anda buat
    buildDockerImageScript: { String imageTag, String envStage, String buildCommand ->
        // "buildDockerImageScript" berisi groovy script untuk melakukan build image
        // Wajib menggunakan variable buildCommand untuk menjalankan perintah docker build
        // Image yang dibuat wajib menggunakan tag dari variable imageTag

        // contoh script untuk menggunakan file .env yang dibuat pada prerunScript dan membuat image
        // useDotenv {
        //     sh "${buildCommand} -t ${imageTag} ."
        // }

        sh "${buildCommand} -t ${imageTag} ."
    },

    // Post Run Script
    // Pada bagian ini anda dapat menambahkan script untuk dijalankan setelah proses pada pipeline selesai
    postrunScript: [
        always: {
            // Pada bagian ini script akan dijalankan setiap pipeline selesai
        },

        success: {
            // Pada bagian ini script hanya akan dijalankan jika pipeline sukses
        },

        failure: {
            // Pada bagian ini script hanya akan dijalankan jika pipeline gagal
        }
    ]
])
