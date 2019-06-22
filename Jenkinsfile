pipeline {
  agent any

  stages {
    stage('Build') {
      steps {
        echo 'Building app image'
        sh 'docker build -t $DOCKER_IMAGE:latest .'
      }
    }
    stage('Tag') {
      when { branch 'master' }
      steps {
        echo 'Tagging and Pushing Latest Image'
        script {
          docker.withRegistry('', 'dockerhub-credentials') {
            sh "docker push $DOCKER_IMAGE:latest"
          }
        }
      }
    }
    stage('Deploy') {
      when { branch 'master' }
      steps {
        echo 'Deploying the latest code...'
        build job: 'wrex-deploy/master', wait: false
      }
    }
  }
  environment {
    DOCKER_IMAGE = "abobwhite/wrex-slack-app"
  }
}
